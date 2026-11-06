/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { spawn, type ChildProcess, type SpawnOptions } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { Readable, Writable } from "node:stream";

import {
  ndJsonStream,
  type AgentConnectionLifecycle,
  type AgentConnector,
  type Stream,
} from "@agentclientprotocol/sdk";

import type { AgentCommand } from "./bins.ts";
import type { Logger } from "./logger.ts";
import type { WorkspaceLayout } from "./workspace.ts";

export type Spawner = (command: string, args: readonly string[], options: SpawnOptions) => ChildProcess;

export const defaultSpawner: Spawner = (command, args, options) => spawn(command, args, options);

/** Signals a process or process group (negative pid). Injected in tests. */
export type Killer = (pid: number, signal: NodeJS.Signals) => void;

export const defaultKiller: Killer = (pid, signal) => {
  try {
    process.kill(pid, signal);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
  }
};

/** Lists live processes with their real uid. Injected in tests. */
export type ProcessLister = () => Promise<{ pid: number; uid: number }[]>;

export const procProcessLister: ProcessLister = async () => {
  const entries = await readdir("/proc").catch(() => [] as string[]);
  const processes = await Promise.all(
    entries
      .filter((entry) => /^\d+$/.test(entry))
      .map(async (entry) => {
        const status = await readFile(`/proc/${entry}/status`, "utf8").catch(() => "");
        const match = /^Uid:\s+(\d+)/m.exec(status);
        return match ? { pid: Number(entry), uid: Number(match[1]) } : undefined;
      })
  );
  return processes.filter((entry): entry is { pid: number; uid: number } => entry !== undefined);
};

/**
 * Kills every process a uid still owns. In `uid` isolation a uid belongs to exactly one workspace
 * dir, so once its last connection is gone anything left running as it (a backgrounded server,
 * a daemonised child that escaped the process group) is a straggler.
 */
export async function reapUid(
  uid: number,
  list: ProcessLister,
  kill: Killer,
  stillIdle: () => boolean = () => true
): Promise<number> {
  if (!Number.isSafeInteger(uid) || uid <= 0) return 0;
  const listed = await list();
  // Checked after the (async) listing and acted on synchronously, so nothing can start in between.
  if (!stillIdle()) return 0;
  const victims = listed.filter((entry) => entry.uid === uid && entry.pid !== process.pid);
  for (const victim of victims) kill(victim.pid, "SIGKILL");
  return victims.length;
}

export interface AgentProcessOptions {
  readonly command: AgentCommand;
  readonly layout: WorkspaceLayout;
  readonly env: Record<string, string>;
  readonly killGraceMs: number;
  readonly maxMessageBytes: number;
  readonly log: Logger;
  readonly spawner?: Spawner;
  readonly killer?: Killer;
  /** Called once, after the process (group) is gone. */
  readonly onExit?: (info: { code: number | null; signal: NodeJS.Signals | null }) => void;
}

const STDERR_TAIL_LINES = 20;

/**
 * One stdio agent behind an ACP connection: the `AgentConnector` the SDK's `AcpServer` connects
 * each accepted WebSocket to. `connect` spawns the adapter bin (as the workspace dir's uid, in its
 * own process group) and pipes ACP frames both ways untouched. When the socket goes away the whole
 * process group gets SIGTERM, then SIGKILL after the grace period; when the agent exits, the
 * socket is closed.
 */
export class AgentProcess implements AgentConnector {
  readonly #options: AgentProcessOptions;
  readonly #kill: Killer;
  #child: ChildProcess | undefined;
  #terminating = false;
  #exited = false;
  #killTimer: ReturnType<typeof setTimeout> | undefined;
  readonly #stderrTail: string[] = [];
  readonly #exit: Promise<void>;
  #resolveExit!: () => void;

  constructor(options: AgentProcessOptions) {
    this.#options = options;
    this.#kill = options.killer ?? defaultKiller;
    this.#exit = new Promise((resolve) => {
      this.#resolveExit = resolve;
    });
  }

  get pid(): number | undefined {
    return this.#child?.pid;
  }

  /** Resolves once the agent process has exited and its group has been killed. */
  get exited(): Promise<void> {
    return this.#exit;
  }

  connect(stream: Stream): AgentConnectionLifecycle {
    const { command, layout, env, log } = this.#options;
    const spawner = this.#options.spawner ?? defaultSpawner;
    const options: SpawnOptions = {
      cwd: layout.cwd,
      env,
      stdio: ["pipe", "pipe", "pipe"],
      // Its own process group, so the agent and everything it starts can be signalled together.
      detached: true,
      ...(layout.uid === undefined ? {} : { uid: layout.uid, gid: layout.gid ?? layout.uid }),
    };

    let child: ChildProcess;
    try {
      child = spawner(command.command, command.args, options);
    } catch (error) {
      log.error("agent-runner: spawn failed", { error: (error as Error).message });
      this.#markExited(null, null);
      void stream.writable.close().catch(() => undefined);
      void stream.readable.cancel().catch(() => undefined);
      return { closed: this.#exit };
    }
    this.#child = child;
    log.info("agent-runner: agent started", { pid: child.pid, uid: layout.uid });

    child.stdin?.on("error", () => undefined);
    child.stdout?.on("error", () => undefined);
    child.stderr?.on("data", (chunk: Buffer) => this.#onStderr(chunk));
    child.once("error", (error) => {
      log.error("agent-runner: agent process error", { error: error.message });
      if (child.pid === undefined) this.#markExited(null, null);
    });
    child.once("exit", (code, signal) => {
      if (code !== 0 && !this.#terminating) {
        log.warn("agent-runner: agent exited unexpectedly", { code, signal, stderr: this.#stderrTail.join("\n") });
      } else {
        log.info("agent-runner: agent exited", { code, signal });
      }
      // Stragglers in the group (a backgrounded shell job) go with it.
      if (child.pid !== undefined) this.#kill(-child.pid, "SIGKILL");
      this.#markExited(code, signal);
    });

    const agentStream = ndJsonStream(
      Writable.toWeb(child.stdin!) as WritableStream<Uint8Array>,
      Readable.toWeb(child.stdout!) as ReadableStream<Uint8Array>,
      { maxMessageBytes: this.#options.maxMessageBytes }
    );
    // Socket → agent. When the socket side ends, the agent is stopped.
    void (async () => {
      await stream.readable.pipeTo(agentStream.writable).catch(() => undefined);
      this.terminate("connection closed");
    })();
    // Agent → socket. When the agent's output ends, the socket side is closed.
    const output = (async () => {
      await agentStream.readable.pipeTo(stream.writable).catch(() => undefined);
      this.terminate("agent output ended");
    })();

    return { closed: Promise.all([this.#exit, output]).then(() => undefined) };
  }

  /** Stop the agent: SIGTERM to its process group now, SIGKILL after the grace period. Idempotent. */
  terminate(reason: string): void {
    if (this.#terminating) return;
    this.#terminating = true;
    const child = this.#child;
    if (!child || this.#exited || child.pid === undefined) return;
    this.#options.log.info("agent-runner: stopping agent", { pid: child.pid, reason });
    child.stdin?.end();
    this.#kill(-child.pid, "SIGTERM");
    this.#killTimer = setTimeout(() => {
      if (!this.#exited && child.pid !== undefined) this.#kill(-child.pid, "SIGKILL");
    }, this.#options.killGraceMs);
    this.#killTimer.unref();
  }

  #markExited(code: number | null, signal: NodeJS.Signals | null): void {
    if (this.#exited) return;
    this.#exited = true;
    this.#terminating = true;
    clearTimeout(this.#killTimer);
    try {
      this.#options.onExit?.({ code, signal });
    } finally {
      this.#resolveExit();
    }
  }

  #onStderr(chunk: Buffer): void {
    for (const line of chunk.toString("utf8").split("\n")) {
      if (!line.trim()) continue;
      this.#stderrTail.push(line.slice(0, 500));
      if (this.#stderrTail.length > STDERR_TAIL_LINES) this.#stderrTail.shift();
      this.#options.log.debug("agent-runner: agent stderr", { line: line.slice(0, 2000) });
    }
  }
}

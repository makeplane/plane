/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* oxlint-disable no-await-in-loop -- polling */
import { spawn, type SpawnOptions } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { AnyMessage } from "@agentclientprotocol/sdk";
import { afterEach, describe, expect, it } from "vitest";

import { AgentProcess, defaultKiller, reapUid, type Killer } from "../src/agent-process.ts";
import { adapterBinPaths } from "../src/bins.ts";
import { silentLogger } from "../src/logger.ts";
import type { AgentRunner } from "../src/server.ts";
import { WORKSPACE_ID, USER_ID, acpClient, isAlive, startRunner, tempRoot, ticket, waitUntil } from "./helpers.ts";

const FIXTURE = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "stubborn-agent.mjs");

/** The socket side of an AgentProcess, as AcpServer would hand it over. */
function socketSide() {
  const toAgent = new TransformStream<AnyMessage, AnyMessage>();
  const fromAgent = new TransformStream<AnyMessage, AnyMessage>();
  return {
    stream: { readable: toAgent.readable, writable: fromAgent.writable },
    send: toAgent.writable.getWriter(),
    receive: fromAgent.readable.getReader(),
  };
}

const list = async () => [
  { pid: 101, uid: 20_000 },
  { pid: 102, uid: 20_001 },
  { pid: 103, uid: 20_000 },
  { pid: process.pid, uid: 20_000 },
];

let runner: AgentRunner | undefined;
afterEach(async () => {
  await runner?.close();
  runner = undefined;
});

describe("AgentProcess cleanup", () => {
  it("kills the whole process group when the connection closes, even an agent that ignores SIGTERM", async () => {
    const root = tempRoot();
    const pidsFile = path.join(root, "pids");
    const agent = new AgentProcess({
      command: { adapter: "echo", command: process.execPath, args: [FIXTURE] },
      layout: { cwd: root, home: root, tmp: root },
      env: { PATH: process.env.PATH ?? "/usr/bin:/bin", FIXTURE_PIDS: pidsFile },
      killGraceMs: 200,
      maxMessageBytes: 1024 * 1024,
      log: silentLogger,
    });
    const side = socketSide();
    agent.connect(side.stream);
    const [pid, grandchild] = (await waitUntil(() => {
      try {
        return readFileSync(pidsFile, "utf8").split(" ").map(Number);
      } catch {
        return undefined;
      }
    })) as [number, number];
    expect(isAlive(pid) && isAlive(grandchild)).toBe(true);

    await side.send.close();
    await agent.exited;
    await waitUntil(() => !isAlive(pid) && !isAlive(grandchild));
  });

  it("closes the connection when the agent exits on its own", async () => {
    const root = tempRoot();
    const agent = new AgentProcess({
      command: { adapter: "echo", command: process.execPath, args: [adapterBinPaths().echo] },
      layout: { cwd: root, home: root, tmp: root },
      env: { PATH: process.env.PATH ?? "/usr/bin:/bin" },
      killGraceMs: 200,
      maxMessageBytes: 1024 * 1024,
      log: silentLogger,
    });
    const side = socketSide();
    const lifecycle = agent.connect(side.stream) as { closed: Promise<void> };
    await waitUntil(() => agent.pid);
    process.kill(agent.pid!, "SIGKILL");
    expect((await side.receive.read()).done).toBe(true);
    await lifecycle.closed;
  });

  it("reaps a uid's leftover processes, and nothing else", async () => {
    const killed: [number, string][] = [];
    const kill: Killer = (pid, signal) => void killed.push([pid, signal]);
    expect(await reapUid(20_000, list, kill)).toBe(2);
    expect(killed).toEqual([
      [101, "SIGKILL"],
      [103, "SIGKILL"],
    ]);
    expect(await reapUid(20_000, list, kill, () => false)).toBe(0);
    expect(await reapUid(0, list, kill)).toBe(0);
  });
});

describe("uid isolation through the runner", () => {
  it("spawns as the dir's uid in its own group, with a scrubbed env, and reaps the uid on close", async () => {
    const chowned: [string, number, number][] = [];
    const spawned: SpawnOptions[] = [];
    const signalled: [number, string][] = [];
    process.env.AGENT_RUNNER_SECRET_SHOULD_NOT_LEAK = "nope";
    const root = tempRoot();
    try {
      const started = await startRunner(root, {
        config: { isolation: "uid" },
        chown: async (target, uid, gid) => void chowned.push([target, uid, gid]),
        // Not root: record the uid/gid the runner asked for, then spawn as ourselves.
        spawner: (command, args, options) => {
          spawned.push(options);
          const { uid: _uid, gid: _gid, ...rest } = options;
          return spawn(command, args, rest);
        },
        killer: (pid, signal) => {
          signalled.push([pid, signal]);
          if (Math.abs(pid) < 900_000) defaultKiller(pid, signal);
        },
        listProcesses: async () => [
          { pid: 900_001, uid: 20_000 },
          { pid: 900_002, uid: 20_005 },
        ],
      });
      runner = started.runner;
      const client = acpClient(started.url, { Authorization: `Bearer ${ticket()}` });
      await client.agent.request("initialize", { protocolVersion: 1 });
      const cwd = path.join(root, WORKSPACE_ID, USER_ID);
      const session = await client.agent.request("session/new", { cwd, mcpServers: [] });
      expect(session.modes?.currentModeId).toBe("ask_writes");

      expect(spawned).toHaveLength(1);
      const options = spawned[0]!;
      expect(options).toMatchObject({ uid: 20_000, gid: 20_000, detached: true, cwd });
      expect(options.env).toMatchObject({
        HOME: path.join(root, ".homes", WORKSPACE_ID, USER_ID),
        TMPDIR: path.join(root, ".tmp", WORKSPACE_ID, USER_ID),
        USER: "plane-agent-20000",
        ANTHROPIC_API_KEY: "sk-ant-agent-key",
        PLANE_AGENT_DEFAULT_MODE: "ask_writes",
      });
      expect(Object.keys(options.env!).some((key) => key.startsWith("AGENT_RUNNER"))).toBe(false);
      expect(chowned.map(([dir]) => dir)).toEqual([
        cwd,
        path.join(root, ".homes", WORKSPACE_ID, USER_ID),
        path.join(root, ".tmp", WORKSPACE_ID, USER_ID),
      ]);
      expect(chowned.every(([, uid, gid]) => uid === 20_000 && gid === 20_000)).toBe(true);

      const pid = runner.agents()[0]!.pid!;
      client.close();
      await waitUntil(() => runner!.agents().length === 0);
      expect(isAlive(pid)).toBe(false);
      expect(signalled).toContainEqual([-pid, "SIGTERM"]);
      await waitUntil(() => signalled.some(([p]) => p === 900_001));
      expect(signalled.some(([p]) => p === 900_002)).toBe(false);
    } finally {
      delete process.env.AGENT_RUNNER_SECRET_SHOULD_NOT_LEAK;
    }
  });

  it.runIf(process.getuid?.() === 0)("really runs the agent as the allocated uid (root only)", async () => {
    const root = tempRoot();
    const started = await startRunner(root, { config: { isolation: "uid" } });
    runner = started.runner;
    const client = acpClient(started.url, { Authorization: `Bearer ${ticket()}` });
    await client.agent.request("initialize", { protocolVersion: 1 });
    const pid = runner.agents()[0]!.pid!;
    const status = readFileSync(`/proc/${pid}/status`, "utf8");
    expect(/^Uid:\s+(\d+)/m.exec(status)?.[1]).toBe("20000");
    client.close();
  });
});

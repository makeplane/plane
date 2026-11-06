/* oxlint-disable no-await-in-loop -- polling until the agent catches up */
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PassThrough, Readable, Writable } from "node:stream";
import { fileURLToPath } from "node:url";

import {
  client,
  ndJsonStream,
  type ClientContext,
  type RequestPermissionRequest,
  type RequestPermissionResponse,
  type SessionNotification,
  type Stream,
} from "@agentclientprotocol/sdk";

import { createAgent, type AgentAdapter, type AgentRuntime } from "../../src/core/agent.ts";
import { sequencedStream } from "../../src/core/stdio.ts";

export const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export type BinName = "echo" | "codex" | "deepseek" | "claude";

export function binPath(bin: BinName): string {
  return path.join(PACKAGE_ROOT, "src/bin", `${bin}.ts`);
}

export function tempDir(prefix = "acp-"): string {
  return mkdtempSync(path.join(tmpdir(), prefix));
}

export type PermissionAnswer = "allow_once" | "allow_always" | "reject_once" | "cancelled";

/** An SDK `client()` connected to an agent, recording everything the agent sends. */
export interface TestClient {
  readonly agent: ClientContext;
  readonly updates: SessionNotification[];
  readonly permissionRequests: RequestPermissionRequest[];
  /** Answers for permission prompts, consumed in order; `allow_once` when empty. */
  readonly answers: PermissionAnswer[];
  waitFor<T>(predicate: () => T | undefined, timeoutMs?: number): Promise<T>;
  close(): Promise<void>;
}

function connectClient(stream: Stream, onClose: () => Promise<void>): TestClient {
  const updates: SessionNotification[] = [];
  const permissionRequests: RequestPermissionRequest[] = [];
  const answers: PermissionAnswer[] = [];
  const app = client({ name: "acp-adapters-test" })
    .onNotification("session/update", ({ params }) => {
      updates.push(params);
    })
    .onRequest("session/request_permission", async ({ params }): Promise<RequestPermissionResponse> => {
      permissionRequests.push(params);
      const answer = answers.shift() ?? "allow_once";
      return answer === "cancelled"
        ? { outcome: { outcome: "cancelled" } }
        : { outcome: { outcome: "selected", optionId: answer } };
    });
  const connection = app.connect(stream);
  return {
    agent: connection.agent,
    updates,
    permissionRequests,
    answers,
    async waitFor(predicate, timeoutMs = 10_000) {
      const deadline = Date.now() + timeoutMs;
      for (;;) {
        const value = predicate();
        if (value !== undefined && value !== false) return value;
        if (Date.now() > deadline) throw new Error("timed out waiting for the agent");
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    },
    async close() {
      connection.close();
      await onClose();
    },
  };
}

export interface SpawnedClient extends TestClient {
  readonly child: ChildProcess;
  stderr(): string;
}

/** Spawn an adapter bin from source (Node strips the types) and connect over its stdio. */
export function spawnClient(bin: BinName, env: NodeJS.ProcessEnv = {}): SpawnedClient {
  const child = spawn(process.execPath, [binPath(bin)], {
    env: { ...process.env, ...env },
    stdio: ["pipe", "pipe", "pipe"],
  });
  let stderr = "";
  child.stderr?.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });
  const stream = ndJsonStream(
    Writable.toWeb(child.stdin!) as WritableStream<Uint8Array>,
    Readable.toWeb(child.stdout!) as ReadableStream<Uint8Array>
  );
  const base = connectClient(stream, async () => {
    child.stdin?.end();
    await new Promise<void>((resolve) => {
      if (child.exitCode !== null) resolve();
      else child.once("exit", () => resolve());
      setTimeout(() => {
        child.kill("SIGKILL");
        resolve();
      }, 5_000).unref();
    });
  });
  return { ...base, child, stderr: () => stderr };
}

export interface InProcessClient extends TestClient {
  readonly runtime: AgentRuntime;
}

/** Run an adapter in-process behind real ndjson byte streams (used where a provider is mocked). */
export function inProcessClient(
  adapter: AgentAdapter,
  env: NodeJS.ProcessEnv = {},
  newSessionId?: () => string
): InProcessClient {
  const toAgent = new PassThrough();
  const fromAgent = new PassThrough();
  const runtime = createAgent(adapter, { env: { ...env }, ...(newSessionId ? { newSessionId } : {}) });
  const agentStream = ndJsonStream(
    Writable.toWeb(fromAgent) as WritableStream<Uint8Array>,
    Readable.toWeb(toAgent) as ReadableStream<Uint8Array>
  );
  const agentConnection = runtime.app.connect(sequencedStream(agentStream, runtime, { drainMs: 2_000 }));
  const clientStream = ndJsonStream(
    Writable.toWeb(toAgent) as WritableStream<Uint8Array>,
    Readable.toWeb(fromAgent) as ReadableStream<Uint8Array>
  );
  const base = connectClient(clientStream, async () => {
    agentConnection.close();
    await runtime.shutdown();
  });
  return { ...base, runtime };
}

export function textOf(
  updates: readonly SessionNotification[],
  kind: "agent_message_chunk" | "agent_thought_chunk"
): string {
  return updates
    .map((notification) => notification.update)
    .map((update) => (update.sessionUpdate === kind && "content" in update ? update.content : undefined))
    .map((content) => (content && !Array.isArray(content) && content.type === "text" ? content.text : ""))
    .join("");
}

export function updatesOfKind<K extends SessionNotification["update"]["sessionUpdate"]>(
  updates: readonly SessionNotification[],
  kind: K
): Extract<SessionNotification["update"], { sessionUpdate: K }>[] {
  return updates
    .map((notification) => notification.update)
    .filter((update) => update.sessionUpdate === kind) as Extract<
    SessionNotification["update"],
    { sessionUpdate: K }
  >[];
}

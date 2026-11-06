/* oxlint-disable no-await-in-loop -- transcripts are replayed step by step */
import { spawn } from "node:child_process";
import { PassThrough, Readable, Writable } from "node:stream";

import { ndJsonStream } from "@agentclientprotocol/sdk";

import { createAgent, type AgentAdapter } from "../../src/core/agent.ts";
import { sequencedStream } from "../../src/core/stdio.ts";
import { binPath, type BinName } from "./client.ts";

/** One golden case, as listed in `tests/golden/manifest.json`. */
export interface GoldenCase {
  readonly id: string;
  readonly adapter: BinName;
  /** `pipe`: raw bytes in, stdin closed, exact stdout out. `script`: an interactive transcript. */
  readonly kind: "pipe" | "script";
  readonly family: "valid" | "malformed" | "transport";
  readonly input: string;
  readonly expected: string;
  readonly exitCode: number;
  /** Byte offsets at which a pipe input is split into separate writes (with a pause between). */
  readonly splitAt?: number[];
  readonly env?: Record<string, string>;
  readonly inputSha256: string;
  readonly expectedSha256: string;
}

export interface RawRun {
  readonly lines: string[];
  readonly stderr: string;
  readonly exitCode: number;
}

/** A raw connection to an agent: lines in, lines out. */
interface RawAgent {
  readonly lines: string[];
  write(data: string | Buffer): void;
  waitFor(predicate: (frame: any, index: number) => boolean, from?: number): Promise<number>;
  onFrame(listener: (frame: any) => void): void;
  end(): Promise<{ exitCode: number; stderr: string }>;
}

function lineCollector(onLine: (line: string) => void): (chunk: Buffer | string) => void {
  let buffer = "";
  return (chunk) => {
    buffer += chunk.toString();
    for (let newline = buffer.indexOf("\n"); newline >= 0; newline = buffer.indexOf("\n")) {
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);
      onLine(line);
    }
  };
}

function rawAgent(
  write: (data: string | Buffer) => void,
  subscribe: (onChunk: (chunk: Buffer | string) => void) => void,
  end: () => Promise<{ exitCode: number; stderr: string }>
): RawAgent {
  const lines: string[] = [];
  const listeners: Array<(frame: any) => void> = [];
  const waiters: Array<() => void> = [];
  subscribe(
    lineCollector((line) => {
      lines.push(line);
      const frame = JSON.parse(line);
      for (const listener of listeners) listener(frame);
      for (const wake of waiters.splice(0)) wake();
    })
  );
  return {
    lines,
    write,
    onFrame: (listener) => listeners.push(listener),
    async waitFor(predicate, from = 0) {
      const deadline = Date.now() + 10_000;
      for (;;) {
        const index = lines.findIndex((line, i) => i >= from && predicate(JSON.parse(line), i));
        if (index >= 0) return index;
        if (Date.now() > deadline) throw new Error(`golden: timed out; frames so far:\n${lines.join("\n")}`);
        await new Promise<void>((resolve) => {
          waiters.push(resolve);
          setTimeout(resolve, 50);
        });
      }
    },
    end,
  };
}

function spawnRaw(bin: BinName, env: NodeJS.ProcessEnv): RawAgent {
  const child = spawn(process.execPath, [binPath(bin)], {
    env: { ...process.env, ...env },
    stdio: ["pipe", "pipe", "pipe"],
  });
  let stderr = "";
  child.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });
  const exited = new Promise<number>((resolve) => child.once("exit", (code) => resolve(code ?? -1)));
  return rawAgent(
    (data) => child.stdin.write(data),
    (onChunk) => child.stdout.on("data", onChunk),
    async () => {
      child.stdin.end();
      const exitCode = await Promise.race([
        exited,
        new Promise<number>((resolve) => setTimeout(() => resolve(-2), 10_000)),
      ]);
      if (exitCode === -2) child.kill("SIGKILL");
      return { exitCode, stderr };
    }
  );
}

function inProcessRaw(adapter: AgentAdapter, env: NodeJS.ProcessEnv): RawAgent {
  const toAgent = new PassThrough();
  const fromAgent = new PassThrough();
  const runtime = createAgent(adapter, { env });
  const stream = ndJsonStream(
    Writable.toWeb(fromAgent) as WritableStream<Uint8Array>,
    Readable.toWeb(toAgent) as ReadableStream<Uint8Array>
  );
  const connection = runtime.app.connect(sequencedStream(stream, runtime, { drainMs: 5_000 }));
  return rawAgent(
    (data) => toAgent.write(data),
    (onChunk) => fromAgent.on("data", onChunk),
    async () => {
      toAgent.end();
      await connection.closed;
      await runtime.shutdown();
      return { exitCode: 0, stderr: "" };
    }
  );
}

/** Run a pipe case: write the bytes (optionally in pieces), close stdin, collect stdout. */
export async function runPipe(
  bin: BinName,
  input: Buffer,
  options: { env?: Record<string, string>; splitAt?: number[] }
): Promise<RawRun> {
  const agent = spawnRaw(bin, options.env ?? {});
  const cuts = [0, ...(options.splitAt ?? []), input.length];
  for (let i = 0; i < cuts.length - 1; i += 1) {
    agent.write(input.subarray(cuts[i], cuts[i + 1]));
    if (i < cuts.length - 2) await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const { exitCode, stderr } = await agent.end();
  return { lines: agent.lines, stderr, exitCode };
}

const isResponse = (id: unknown) => (frame: any) => frame.id === id && frame.method === undefined;

type ScriptStep =
  | { answers: Array<"allow_once" | "allow_always" | "reject_once" | "cancelled"> }
  | { send: Record<string, unknown>; await?: boolean }
  | { waitFor: string }
  | { awaitResponse: string | number };

/**
 * Run a script case: each `send` is written and, for requests, its response awaited before the
 * next step (as a real client would). Agent requests (permission prompts) are answered from the
 * `answers` list. `$SESSION_ID`, `$CWD` and the other variables are substituted in both directions.
 */
export async function runScript(
  target: { bin: BinName; env: NodeJS.ProcessEnv } | { adapter: AgentAdapter; env: NodeJS.ProcessEnv },
  script: string,
  vars: Record<string, string>
): Promise<RawRun> {
  const agent = "bin" in target ? spawnRaw(target.bin, target.env) : inProcessRaw(target.adapter, target.env);
  const steps = script
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as ScriptStep);
  const answers: string[] = [];
  agent.onFrame((frame) => {
    if (typeof frame.method === "string" && frame.id !== undefined) {
      const answer = answers.shift() ?? "allow_once";
      const outcome = answer === "cancelled" ? { outcome: "cancelled" } : { outcome: "selected", optionId: answer };
      agent.write(`${JSON.stringify({ jsonrpc: "2.0", id: frame.id, result: { outcome } })}\n`);
    }
  });
  const substitute = (text: string) =>
    Object.entries(vars).reduce((out, [name, value]) => out.split(`$${name}`).join(value), text);
  let mark = 0;
  for (const step of steps) {
    if ("answers" in step) {
      answers.push(...step.answers);
    } else if ("send" in step) {
      const message = JSON.parse(substitute(JSON.stringify(step.send)));
      mark = agent.lines.length;
      agent.write(`${JSON.stringify(message)}\n`);
      if (message.id !== undefined && step.await !== false) {
        const index = await agent.waitFor(isResponse(message.id), mark);
        const response = JSON.parse(agent.lines[index]!);
        if (message.method === "session/new" && response.result?.sessionId) vars.SESSION_ID = response.result.sessionId;
      }
    } else if ("waitFor" in step) {
      mark = (await agent.waitFor((frame) => frame.params?.update?.sessionUpdate === step.waitFor, mark)) + 1;
    } else {
      await agent.waitFor(isResponse(step.awaitResponse));
    }
  }
  const { exitCode, stderr } = await agent.end();
  // Normalise run-specific values back to their variable names.
  const lines = agent.lines.map((line) =>
    Object.entries(vars)
      .filter(([, value]) => value.length > 3)
      .reduce((out, [name, value]) => out.split(value).join(`$${name}`), line)
  );
  return { lines, stderr, exitCode };
}

/**
 * Invariants every transcript must satisfy, whatever its content: stdout is JSON-RPC 2.0 only, and
 * a session's `session/new` response is written before any notification about that session.
 */
export function protocolViolations(lines: readonly string[]): string[] {
  const problems: string[] = [];
  const announced = new Set<string>();
  lines.forEach((line, index) => {
    let frame: any;
    try {
      frame = JSON.parse(line);
    } catch {
      problems.push(`line ${index + 1} is not JSON`);
      return;
    }
    if (!frame || typeof frame !== "object" || Array.isArray(frame) || frame.jsonrpc !== "2.0") {
      problems.push(`line ${index + 1} is not a JSON-RPC 2.0 object`);
      return;
    }
    if (typeof frame.result?.sessionId === "string") announced.add(frame.result.sessionId);
    const sessionId = frame.params?.sessionId;
    if (frame.method === "session/update" && typeof sessionId === "string" && !announced.has(sessionId)) {
      problems.push(`line ${index + 1} updates session ${sessionId} before session/new answered`);
    }
  });
  return problems;
}

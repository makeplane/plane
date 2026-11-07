/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { spawn } from "node:child_process";
import type { Readable, Writable } from "node:stream";

import { AI_PROVIDERS_SETTINGS } from "../core/auth.ts";
import { PACKAGE_VERSION } from "../core/info.ts";
import { objectValue, stringValue, type JsonObject } from "../core/json.ts";

/** The slice of a child process the client needs; tests pass a fake. Ported from employ_ai. */
export interface CodexAppServerProcess {
  readonly stdin: Writable;
  readonly stdout: Readable;
  readonly stderr: Readable;
  on?(event: "error", listener: (error: Error) => void): unknown;
  on?(event: "exit", listener: (code: number | null, signal: NodeJS.Signals | null) => void): unknown;
  kill(signal?: NodeJS.Signals | number): boolean;
}

export type SpawnCodexAppServer = (
  command: string,
  args: readonly string[],
  options: { cwd: string; env: NodeJS.ProcessEnv }
) => CodexAppServerProcess;

export type JsonRpcId = string | number;

export interface CodexServerRequest {
  readonly id: JsonRpcId;
  readonly method: string;
  readonly params: JsonObject;
}

export interface CodexNotification {
  readonly method: string;
  readonly params: JsonObject;
}

export interface CodexClientOptions {
  readonly cwd: string;
  readonly env: NodeJS.ProcessEnv;
  readonly spawnAppServer?: SpawnCodexAppServer;
  readonly onNotification: (notification: CodexNotification) => void;
  readonly onServerRequest: (request: CodexServerRequest) => void;
  /** Called once if the process exits or fails while the client is open. */
  readonly onExit: (error: Error) => void;
}

/** `codex` must be on PATH; the runner image installs it. Not configurable, by design: the agent env is admin-supplied. */
export const CODEX_COMMAND = "codex";
const CODEX_ARGS = ["app-server"] as const;
const STDERR_LINES = 100;

export const defaultSpawnAppServer: SpawnCodexAppServer = (command, args, { cwd, env }) =>
  spawn(command, [...args], { cwd, env, stdio: ["pipe", "pipe", "pipe"] });

/**
 * JSON-RPC (newline-delimited, no `jsonrpc` field) client for `codex app-server`, ported from
 * employ_ai `codex/app-server-client.ts`. Push-based: notifications and server requests are
 * delivered to callbacks as they arrive.
 */
export class CodexAppServerClient {
  readonly #proc: CodexAppServerProcess;
  readonly #options: CodexClientOptions;
  readonly #pending = new Map<
    JsonRpcId,
    { method: string; resolve: (value: JsonObject) => void; reject: (error: Error) => void; timeout: NodeJS.Timeout }
  >();
  readonly #stderr: string[] = [];
  #stdoutBuffer = "";
  #stderrBuffer = "";
  #nextId = 1;
  #closed = false;
  #activityAt = Date.now();

  constructor(options: CodexClientOptions) {
    this.#options = options;
    this.#proc = (options.spawnAppServer ?? defaultSpawnAppServer)(CODEX_COMMAND, CODEX_ARGS, {
      cwd: options.cwd,
      env: options.env,
    });
    this.#proc.on?.("error", (error: Error) => this.#fail(error));
    this.#proc.on?.("exit", (code: number | null, signal: NodeJS.Signals | null) =>
      this.#fail(new Error(`codex app-server exited (${signal ?? `code ${code}`})`))
    );
    this.#proc.stdout.on("data", (chunk: Buffer | string) => this.#readStdout(String(chunk)));
    this.#proc.stderr.on("data", (chunk: Buffer | string) => this.#readStderr(String(chunk)));
    this.#proc.stdin.on("error", (error: Error) => this.#fail(error));
  }

  async initialize(): Promise<JsonObject> {
    const result = await this.request(
      "initialize",
      {
        clientInfo: { name: "plane_acp", title: "Plane agent chat", version: PACKAGE_VERSION },
        capabilities: { experimentalApi: false, requestAttestation: false },
      },
      15_000
    );
    this.notify("initialized");
    return result;
  }

  request(method: string, params: JsonObject = {}, timeoutMs = 30_000): Promise<JsonObject> {
    if (this.#closed) return Promise.reject(new Error("codex app-server client is closed"));
    const id = this.#nextId++;
    const promise = new Promise<JsonObject>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.#pending.delete(id);
        reject(new Error(`codex app-server ${method} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.#pending.set(id, { method, resolve, reject, timeout });
    });
    this.#write({ id, method, params });
    return promise;
  }

  notify(method: string, params: JsonObject = {}): void {
    this.#write({ method, params });
  }

  respond(id: JsonRpcId, result: JsonObject): void {
    this.#write({ id, result });
  }

  respondError(id: JsonRpcId, code: number, message: string): void {
    this.#write({ id, error: { code, message } });
  }

  stderrTail(lines = 12): readonly string[] {
    return this.#stderr.slice(-lines);
  }

  lastActivityAt(): number {
    return this.#activityAt;
  }

  get closed(): boolean {
    return this.#closed;
  }

  close(): void {
    if (this.#closed) return;
    this.#closed = true;
    this.#rejectPending(new Error("codex app-server client closed"));
    this.#proc.stdin.end();
    this.#proc.kill("SIGTERM");
  }

  #write(payload: JsonObject): void {
    if (this.#closed) return;
    try {
      this.#proc.stdin.write(`${JSON.stringify(payload)}\n`);
    } catch (error) {
      this.#fail(error instanceof Error ? error : new Error(String(error)));
    }
  }

  #readStdout(chunk: string): void {
    this.#stdoutBuffer += chunk;
    for (;;) {
      const newline = this.#stdoutBuffer.indexOf("\n");
      if (newline < 0) break;
      const line = this.#stdoutBuffer.slice(0, newline).trim();
      this.#stdoutBuffer = this.#stdoutBuffer.slice(newline + 1);
      if (!line) continue;
      let message: JsonObject;
      try {
        message = objectValue(JSON.parse(line));
      } catch {
        this.#pushStderr(`<non-json stdout> ${line.slice(0, 200)}`);
        continue;
      }
      this.#dispatch(message);
    }
  }

  #readStderr(chunk: string): void {
    this.#stderrBuffer += chunk;
    for (;;) {
      const newline = this.#stderrBuffer.indexOf("\n");
      if (newline < 0) break;
      const line = this.#stderrBuffer.slice(0, newline).trimEnd();
      this.#stderrBuffer = this.#stderrBuffer.slice(newline + 1);
      if (line) this.#pushStderr(line);
    }
  }

  #dispatch(message: JsonObject): void {
    this.#activityAt = Date.now();
    const method = stringValue(message.method);
    const id = message.id as JsonRpcId | undefined;
    if (!method && id !== undefined) {
      const pending = this.#pending.get(id);
      if (!pending) return;
      this.#pending.delete(id);
      clearTimeout(pending.timeout);
      if ("error" in message) {
        pending.reject(
          new Error(stringValue(objectValue(message.error).message) || `codex app-server ${pending.method} failed`)
        );
      } else {
        pending.resolve(objectValue(message.result));
      }
      return;
    }
    if (!method) return;
    if (id !== undefined) this.#options.onServerRequest({ id, method, params: objectValue(message.params) });
    else this.#options.onNotification({ method, params: objectValue(message.params) });
  }

  #pushStderr(line: string): void {
    this.#activityAt = Date.now();
    this.#stderr.push(line);
    if (this.#stderr.length > STDERR_LINES) this.#stderr.splice(0, this.#stderr.length - STDERR_LINES);
  }

  #rejectPending(error: Error): void {
    for (const pending of this.#pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.#pending.clear();
  }

  #fail(error: Error): void {
    if (this.#closed) return;
    this.#closed = true;
    this.#pushStderr(error.message);
    this.#rejectPending(error);
    this.#options.onExit(error);
  }
}

export const CODEX_SIGNED_OUT = `Codex is not signed in: add an OpenAI API key or sign in with ChatGPT in ${AI_PROVIDERS_SETTINGS} (or set OPENAI_API_KEY in the agent's env)`;

/** Map an auth-looking failure to an actionable message (ported from employ_ai). */
export function classifyCodexFailure(message: string, stderr: readonly string[]): string {
  const text = `${message}\n${stderr.join("\n")}`.toLowerCase();
  if (/(unauthorized|401|not logged in|login required|invalid api key|expired token|refresh token)/.test(text)) {
    return CODEX_SIGNED_OUT;
  }
  return message;
}

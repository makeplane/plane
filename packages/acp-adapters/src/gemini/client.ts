/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { spawn, type ChildProcess } from "node:child_process";

import { objectValue, stringValue, type JsonObject } from "../core/json.ts";

export type JsonRpcId = string | number;

/** A JSON-RPC error answered by `gemini --acp`. Gemini uses HTTP statuses as codes for model errors. */
export class GeminiRpcError extends Error {
  readonly code: number;
  readonly data: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = "GeminiRpcError";
    this.code = code;
    this.data = data;
  }
}

export interface GeminiClientOptions {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly env: NodeJS.ProcessEnv;
  readonly onNotification: (method: string, params: JsonObject) => void;
  readonly onRequest: (id: JsonRpcId, method: string, params: JsonObject) => void;
  /** Called once if the process exits or fails while the client is open. */
  readonly onExit: (error: Error) => void;
}

const STDERR_LINES = 100;
const KILL_GRACE_MS = 2_000;

/**
 * ACP client side of a `gemini --acp` child: newline-delimited JSON-RPC 2.0 over its stdio.
 *
 * Gemini writes non-protocol text to stdout in a few failure paths (its OAuth user-code prompt, for
 * one), so lines that are not JSON are kept with stderr for diagnostics instead of breaking the
 * connection. The child is its own process group, killed as a group on close.
 */
export class GeminiAcpClient {
  readonly #proc: ChildProcess;
  readonly #options: GeminiClientOptions;
  readonly #pending = new Map<
    JsonRpcId,
    { method: string; resolve: (value: JsonObject) => void; reject: (error: Error) => void; timeout?: NodeJS.Timeout }
  >();
  readonly #stderr: string[] = [];
  readonly #exited: Promise<void>;
  #stdoutBuffer = "";
  #stderrBuffer = "";
  #nextId = 1;
  #closed = false;

  constructor(options: GeminiClientOptions) {
    this.#options = options;
    this.#proc = spawn(options.command, [...options.args], {
      cwd: options.cwd,
      env: options.env,
      stdio: ["pipe", "pipe", "pipe"],
      detached: true,
    });
    this.#exited = new Promise((resolve) => this.#proc.once("exit", () => resolve()));
    this.#proc.on("error", (error: Error) => this.#fail(error));
    this.#proc.on("exit", (code, signal) => this.#fail(new Error(`gemini exited (${signal ?? `code ${code}`})`)));
    this.#proc.stdout?.on("data", (chunk: Buffer | string) => this.#readStdout(String(chunk)));
    this.#proc.stderr?.on("data", (chunk: Buffer | string) => this.#readStderr(String(chunk)));
    this.#proc.stdin?.on("error", (error: Error) => this.#fail(error));
  }

  get pid(): number | undefined {
    return this.#proc.pid;
  }

  get closed(): boolean {
    return this.#closed;
  }

  /** Send a request; `timeoutMs` of 0 waits for as long as it takes (a prompt turn). */
  request(method: string, params: JsonObject, timeoutMs = 30_000): Promise<JsonObject> {
    if (this.#closed) return Promise.reject(new Error("gemini is not running"));
    const id = this.#nextId++;
    const promise = new Promise<JsonObject>((resolve, reject) => {
      const timeout =
        timeoutMs > 0
          ? setTimeout(() => {
              this.#pending.delete(id);
              reject(new Error(`gemini ${method} timed out after ${timeoutMs}ms`));
            }, timeoutMs)
          : undefined;
      this.#pending.set(id, { method, resolve, reject, ...(timeout ? { timeout } : {}) });
    });
    this.#write({ jsonrpc: "2.0", id, method, params });
    return promise;
  }

  notify(method: string, params: JsonObject): void {
    this.#write({ jsonrpc: "2.0", method, params });
  }

  respond(id: JsonRpcId, result: JsonObject): void {
    this.#write({ jsonrpc: "2.0", id, result });
  }

  respondError(id: JsonRpcId, code: number, message: string): void {
    this.#write({ jsonrpc: "2.0", id, error: { code, message } });
  }

  stderrTail(lines = 12): readonly string[] {
    return this.#stderr.slice(-lines);
  }

  /** End stdin and kill the process group; resolves once it exited (or after the grace period). */
  async close(): Promise<void> {
    if (!this.#closed) {
      this.#closed = true;
      this.#rejectPending(new Error("gemini client closed"));
      this.#proc.stdin?.end();
    }
    if (this.#proc.exitCode !== null || this.#proc.signalCode !== null) return;
    this.#killGroup("SIGTERM");
    const timer = setTimeout(() => this.#killGroup("SIGKILL"), KILL_GRACE_MS);
    timer.unref();
    await Promise.race([this.#exited, new Promise((resolve) => setTimeout(resolve, KILL_GRACE_MS).unref())]);
  }

  #killGroup(signal: NodeJS.Signals): void {
    const pid = this.#proc.pid;
    if (pid === undefined) return;
    try {
      process.kill(-pid, signal);
    } catch {
      try {
        this.#proc.kill(signal);
      } catch {
        // Already gone.
      }
    }
  }

  #write(payload: JsonObject): void {
    if (this.#closed) return;
    try {
      this.#proc.stdin?.write(`${JSON.stringify(payload)}\n`);
    } catch (error) {
      this.#fail(error instanceof Error ? error : new Error(String(error)));
    }
  }

  #readStdout(chunk: string): void {
    this.#stdoutBuffer += chunk;
    for (let newline = this.#stdoutBuffer.indexOf("\n"); newline >= 0; newline = this.#stdoutBuffer.indexOf("\n")) {
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
    for (let newline = this.#stderrBuffer.indexOf("\n"); newline >= 0; newline = this.#stderrBuffer.indexOf("\n")) {
      const line = this.#stderrBuffer.slice(0, newline).trimEnd();
      this.#stderrBuffer = this.#stderrBuffer.slice(newline + 1);
      if (line) this.#pushStderr(line);
    }
  }

  #dispatch(message: JsonObject): void {
    const method = stringValue(message.method);
    const id = message.id as JsonRpcId | undefined | null;
    const hasId = typeof id === "string" || typeof id === "number";
    if (!method && hasId) {
      const pending = this.#pending.get(id);
      if (!pending) return;
      this.#pending.delete(id);
      if (pending.timeout) clearTimeout(pending.timeout);
      if ("error" in message) {
        const error = objectValue(message.error);
        const details = stringValue(objectValue(error.data).details);
        pending.reject(
          new GeminiRpcError(
            typeof error.code === "number" ? error.code : -32603,
            details || stringValue(error.message) || `gemini ${pending.method} failed`,
            error.data
          )
        );
      } else {
        pending.resolve(objectValue(message.result));
      }
      return;
    }
    if (!method) return;
    if (hasId) this.#options.onRequest(id, method, objectValue(message.params));
    else this.#options.onNotification(method, objectValue(message.params));
  }

  #pushStderr(line: string): void {
    this.#stderr.push(line);
    if (this.#stderr.length > STDERR_LINES) this.#stderr.splice(0, this.#stderr.length - STDERR_LINES);
  }

  #rejectPending(error: Error): void {
    for (const pending of this.#pending.values()) {
      if (pending.timeout) clearTimeout(pending.timeout);
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

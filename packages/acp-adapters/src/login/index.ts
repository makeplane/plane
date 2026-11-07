/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createInterface } from "node:readline";

import { agentHome } from "../core/auth.ts";
import { errorMessage } from "../core/json.ts";
import { codexLogout, codexStart, codexStatus } from "./codex.ts";
import { geminiLogout, geminiStart, geminiStatus } from "./gemini.ts";
import type { LoginIo } from "./shared.ts";

export type { LoginEvent, LoginIo } from "./shared.ts";

/**
 * `plane-agent-login <codex|gemini> <start|logout|status>`: signs the user in to a provider
 * account (ChatGPT for Codex, Google for Gemini CLI) inside their agent home. The runner starts it
 * as the user's uid with `HOME` set to the user's home and reads newline-delimited JSON events from
 * stdout; it answers on stdin with one JSON line when a flow needs a code. Logs go to stderr.
 */
const PROVIDERS = ["codex", "gemini"] as const;
const ACTIONS = ["start", "logout", "status"] as const;

function stdinLines(): () => Promise<unknown> {
  const queue: string[] = [];
  const waiters: Array<(line: string | undefined) => void> = [];
  let ended = false;
  const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
  lines.on("line", (line) => {
    if (!line.trim()) return;
    const waiter = waiters.shift();
    if (waiter) waiter(line);
    else queue.push(line);
  });
  lines.on("close", () => {
    ended = true;
    for (const waiter of waiters.splice(0)) waiter(undefined);
  });
  return async () => {
    const line =
      queue.shift() ?? (ended ? undefined : await new Promise<string | undefined>((resolve) => waiters.push(resolve)));
    if (line === undefined) return undefined;
    try {
      return JSON.parse(line) as unknown;
    } catch {
      return { invalid: line };
    }
  };
}

/** Run the helper; resolves with the process exit code. */
export async function runLoginHelper(argv: readonly string[], io?: Partial<LoginIo>): Promise<number> {
  console.log = console.error;
  console.info = console.error;
  const [provider, action] = argv;
  const env = io?.env ?? process.env;
  const controller = new AbortController();
  const onSignal = () => controller.abort("signal");
  process.once("SIGTERM", onSignal);
  process.once("SIGINT", onSignal);
  let readStdin: (() => Promise<unknown>) | undefined;
  const helper: LoginIo = {
    env,
    home: io?.home ?? agentHome(env),
    emit: io?.emit ?? ((event) => process.stdout.write(`${JSON.stringify(event)}\n`)),
    readLine: io?.readLine ?? (() => (readStdin ??= stdinLines())()),
    log: io?.log ?? ((message) => process.stderr.write(`plane-agent-login: ${message}\n`)),
    signal: io?.signal ?? controller.signal,
  };
  try {
    if (!PROVIDERS.includes(provider as never) || !ACTIONS.includes(action as never)) {
      helper.emit({ event: "failed", error: "usage: plane-agent-login <codex|gemini> <start|logout|status>" });
      return 2;
    }
    if (action === "status") {
      helper.emit(provider === "codex" ? await codexStatus(helper) : geminiStatus(helper));
      return 0;
    }
    if (action === "logout") {
      if (provider === "codex") codexLogout(helper);
      else geminiLogout(helper);
      helper.emit({ event: "disconnected" });
      return 0;
    }
    const result = provider === "codex" ? await codexStart(helper) : await geminiStart(helper);
    helper.emit(result);
    return result.event === "connected" ? 0 : 1;
  } catch (error) {
    helper.log(errorMessage(error));
    helper.emit({ event: "failed", error: errorMessage(error) });
    return 1;
  } finally {
    process.off("SIGTERM", onSignal);
    process.off("SIGINT", onSignal);
    // stdin may still be open (the runner keeps it for `complete`); the helper is done with it.
    if (readStdin) process.stdin.destroy();
  }
}

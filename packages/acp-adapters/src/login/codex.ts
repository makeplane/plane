/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* oxlint-disable no-await-in-loop -- waiting for the app-server's completion notification */
import { existsSync } from "node:fs";
import path from "node:path";

import { ensurePrivateDir } from "../core/auth.ts";
import { objectValue, stringValue, type JsonObject } from "../core/json.ts";
import { CodexAppServerClient } from "../codex/client.ts";
import { codexHomeOf, failed, removeFiles, within, type LoginEvent, type LoginIo } from "./shared.ts";

/** ChatGPT device-code sign-ins expire after 15 minutes. */
export const CODEX_LOGIN_TIMEOUT_MS = 15 * 60_000;
const AUTH_FILE = "auth.json";

interface AppServer {
  readonly client: CodexAppServerClient;
  /** Resolves with the next `account/login/completed` for `loginId` (or one without an id). */
  completed(loginId: string): Promise<JsonObject>;
}

function appServer(io: LoginIo): AppServer {
  const codexHome = ensurePrivateDir(codexHomeOf(io.home));
  // The sign-in lands in ~/.codex; a key in the env must never be used instead.
  const { OPENAI_API_KEY: _apiKey, ...env } = io.env;
  const completions: JsonObject[] = [];
  let wake: (() => void) | undefined;
  let exited: Error | undefined;
  const client = new CodexAppServerClient({
    cwd: io.home,
    env: { ...env, CODEX_HOME: codexHome },
    onNotification: ({ method, params }) => {
      if (method !== "account/login/completed") return;
      completions.push(params);
      wake?.();
    },
    onServerRequest: (request) => client.respondError(request.id, -32601, `${request.method} is not supported`),
    onExit: (error) => {
      exited = error;
      wake?.();
    },
  });
  return {
    client,
    async completed(loginId) {
      for (;;) {
        const index = completions.findIndex((params) => {
          const id = stringValue(params.loginId);
          return !id || id === loginId;
        });
        if (index >= 0) return completions.splice(index, 1)[0]!;
        if (exited) throw exited;
        await new Promise<void>((resolve) => {
          wake = resolve;
        });
      }
    },
  };
}

function chatgptAccount(response: JsonObject): Record<string, string | null> | undefined {
  const account = objectValue(response.account);
  if (stringValue(account.type) !== "chatgpt") return undefined;
  return { email: stringValue(account.email) || null, plan: stringValue(account.planType) || null };
}

/** `codex start`: ChatGPT device-code sign-in through `codex app-server`, saved in `~/.codex`. */
export async function codexStart(io: LoginIo): Promise<LoginEvent> {
  const server = appServer(io);
  const { client } = server;
  try {
    await client.initialize();
    const started = await client.request("account/login/start", { type: "chatgptDeviceCode" });
    const loginId = stringValue(started.loginId);
    const verificationUrl = stringValue(started.verificationUrl);
    const userCode = stringValue(started.userCode);
    if (!verificationUrl || !userCode) return failed("codex did not return a device code");
    io.emit({ event: "pending", verificationUrl, userCode, needsCode: false });

    const outcome = await within(server.completed(loginId), io.signal, CODEX_LOGIN_TIMEOUT_MS);
    if (!("value" in outcome)) {
      if (loginId) await client.request("account/login/cancel", { loginId }, 5_000).catch(() => {});
      return failed(
        outcome.stopped === "timeout" ? "the ChatGPT sign-in timed out" : "the ChatGPT sign-in was cancelled"
      );
    }
    if (outcome.value.success !== true) return failed(stringValue(outcome.value.error) || "the ChatGPT sign-in failed");
    const account = chatgptAccount(await client.request("account/read", { refreshToken: false }));
    if (!account) return failed("codex is not signed in with ChatGPT after the sign-in");
    return { event: "connected", account };
  } finally {
    client.close();
  }
}

/** `codex status`: is `~/.codex` signed in with ChatGPT, and as whom. */
export async function codexStatus(io: LoginIo): Promise<LoginEvent> {
  if (!existsSync(path.join(codexHomeOf(io.home), AUTH_FILE))) return { event: "status", connected: false };
  const { client } = appServer(io);
  try {
    await client.initialize();
    const account = chatgptAccount(await client.request("account/read", { refreshToken: false }));
    return account ? { event: "status", connected: true, account } : { event: "status", connected: false };
  } finally {
    client.close();
  }
}

/** `codex logout`: forget the ChatGPT sign-in. */
export function codexLogout(io: LoginIo): void {
  removeFiles(path.join(codexHomeOf(io.home), AUTH_FILE));
}

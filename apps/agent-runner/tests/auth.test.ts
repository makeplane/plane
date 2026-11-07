/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* oxlint-disable no-await-in-loop -- requests in order */
import { spawn, type SpawnOptions } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import { defaultKiller } from "../src/agent-process.ts";
import { parseHelperEvent, type LoginTimeouts } from "../src/login.ts";
import type { AgentRunner } from "../src/server.ts";
import {
  OTHER_USER_ID,
  USER_ID,
  WORKSPACE_ID,
  authCall,
  isAlive,
  loginTicket,
  startRunner,
  tempRoot,
  ticket,
  upgradeStatus,
  waitUntil,
} from "./helpers.ts";

const FIXTURE = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "fake-login.mjs");
const helper = (...options: string[]) => ({ command: process.execPath, args: [FIXTURE, ...options] });

let runner: AgentRunner | undefined;
let url = "";
let root = "";
afterEach(async () => {
  await runner?.close();
  runner = undefined;
});

async function start(
  options: string[] = [],
  extra: { timeouts?: Partial<LoginTimeouts>; isolation?: "uid" | "none" } & Partial<
    Parameters<typeof startRunner>[1]
  > = {}
) {
  root = tempRoot();
  const { timeouts, isolation, ...rest } = extra;
  const started = await startRunner(root, {
    loginHelper: helper(...options),
    ...(timeouts ? { loginTimeouts: timeouts } : {}),
    ...(isolation ? { config: { isolation } } : {}),
    ...rest,
  });
  runner = started.runner;
  url = started.url;
}

const home = () => path.join(root, ".homes", WORKSPACE_ID, USER_ID);
const status = (loginId: unknown, claims = {}) =>
  authCall(url, `status?loginId=${encodeURIComponent(String(loginId))}`, { claims });

describe("sign-in tickets", () => {
  it("accepts only fresh, signed login tickets for sign-in adapters", async () => {
    await start();
    expect((await authCall(url, "start", { method: "POST", token: null })).status).toBe(401);
    expect((await authCall(url, "start", { method: "POST", token: "garbage" })).status).toBe(401);
    // An agent (acp) ticket cannot drive a sign-in…
    expect((await authCall(url, "start", { method: "POST", token: ticket({ adapter: "codex" }) })).status).toBe(401);
    // …and a sign-in ticket cannot start an agent.
    expect(await upgradeStatus(url, { Authorization: `Bearer ${loginTicket()}` })).toBe(401);
    expect(await upgradeStatus(url, { Authorization: `Bearer ${ticket({ purpose: "acp" })}` })).toBe(101);

    const expired = loginTicket({}, { now: Date.now() - 120_000 });
    expect((await authCall(url, "start", { method: "POST", token: expired })).status).toBe(401);

    for (const adapter of ["claude", "deepseek", "echo"]) {
      const refused = await authCall(url, "start", { method: "POST", claims: { adapter } });
      expect(refused.status, adapter).toBe(400);
    }

    const once = loginTicket();
    expect((await authCall(url, "start", { method: "POST", token: once })).status).toBe(200);
    expect((await authCall(url, "start", { method: "POST", token: once })).status).toBe(401);
    expect((await authCall(url, "logout", { method: "POST", token: once })).status).toBe(401);
  });

  it("rejects malformed bodies", async () => {
    await start();
    const base = url.replace(/^ws:/, "http:").replace(/\/acp$/, "");
    const response = await fetch(`${base}/auth/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${loginTicket({ adapter: "gemini" })}`, "Content-Type": "application/json" },
      body: "{not json",
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid JSON" });
  });
});

describe("ChatGPT sign-in (codex)", () => {
  it("starts the helper as the dir's user, reports the device code, then the account", async () => {
    await start(["--connect-after=300"]);
    const started = await authCall(url, "start", { method: "POST", claims: { env: { OPENAI_API_KEY: "sk-never" } } });
    expect(started.status).toBe(200);
    expect(started.body).toEqual({
      loginId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      verificationUrl: "https://auth.openai.com/codex/device",
      userCode: "ABCD-1234",
      needsCode: false,
    });
    expect((await status(started.body.loginId)).body).toEqual({ status: "pending" });

    const connected = await waitUntil(async () => {
      const current = await status(started.body.loginId);
      return current.body.status === "connected" ? current : undefined;
    });
    expect(connected.body).toEqual({ status: "connected", account: { email: "ada@example.com", plan: "plus" } });
    expect(existsSync(path.join(home(), ".codex", "auth.json"))).toBe(true);

    const record = JSON.parse(readFileSync(path.join(home(), "fake-login-start.json"), "utf8")) as {
      args: string[];
      cwd: string;
      env: Record<string, string>;
    };
    expect(record.args.slice(-2)).toEqual(["codex", "start"]);
    expect(record.cwd).toBe(path.join(root, WORKSPACE_ID, USER_ID));
    expect(record.env.HOME).toBe(home());
    expect(record.env.TMPDIR).toBe(path.join(root, ".tmp", WORKSPACE_ID, USER_ID));
    // Built from nothing: no runner secrets, and no provider keys even if a ticket carried some.
    expect(record.env.OPENAI_API_KEY).toBeUndefined();
    expect(Object.keys(record.env).filter((key) => key.startsWith("AGENT_RUNNER"))).toEqual([]);
    expect(Object.keys(record.env).toSorted()).toEqual(
      [
        "HOME",
        "LANG",
        "LC_ALL",
        "LOGNAME",
        "PATH",
        "PLANE_AGENT_DEFAULT_MODE",
        "SHELL",
        "TERM",
        "TMPDIR",
        "USER",
      ].toSorted()
    );
  });

  it("does not take a code", async () => {
    await start();
    const started = await authCall(url, "start", { method: "POST" });
    const completed = await authCall(url, "complete", { body: { loginId: started.body.loginId, code: "x" } });
    expect(completed).toEqual({ status: 400, body: { error: "This sign-in does not take a code" } });
  });

  it("only shows a sign-in to its own user, workspace and adapter", async () => {
    await start();
    const started = await authCall(url, "start", { method: "POST" });
    const loginId = started.body.loginId as string;
    expect((await status(loginId)).status).toBe(200);
    expect((await status(loginId, { userId: OTHER_USER_ID })).status).toBe(404);
    expect((await status(loginId, { workspaceId: "66666666-6666-4666-8666-666666666666" })).status).toBe(404);
    expect((await status(loginId, { adapter: "gemini" })).status).toBe(404);
    expect((await status("00000000-0000-4000-8000-000000000000")).status).toBe(404);
    expect((await status("../../etc")).status).toBe(404);
    const foreign = await authCall(url, "complete", {
      body: { loginId, code: "good-code" },
      claims: { userId: OTHER_USER_ID },
    });
    expect(foreign.status).toBe(404);
  });

  it("stops the previous sign-in when a new one starts, process group included", async () => {
    await start(["--scenario=stubborn"]);
    const first = await authCall(url, "start", { method: "POST" });
    const [pid, grandchild] = readFileSync(path.join(home(), "fake-login-pids"), "utf8").split(" ").map(Number) as [
      number,
      number,
    ];
    expect(isAlive(pid) && isAlive(grandchild)).toBe(true);
    const second = await authCall(url, "start", { method: "POST" });
    expect(second.status).toBe(200);
    expect(second.body.loginId).not.toBe(first.body.loginId);
    expect((await status(first.body.loginId)).body).toEqual({ status: "failed", error: "Another sign-in was started" });
    expect((await status(second.body.loginId)).body).toEqual({ status: "pending" });
    await waitUntil(() => !isAlive(pid) && !isAlive(grandchild));
    expect(runner!.agents()).toHaveLength(0);
  });

  it("reports helper failures, crashes and silence", async () => {
    await start(["--scenario=fail"]);
    expect(await authCall(url, "start", { method: "POST" })).toEqual({
      status: 502,
      body: { error: "Device code sign-in is disabled for this account", reason: "helper_failed" },
    });
    await runner!.close();

    await start(["--scenario=crash"]);
    expect(await authCall(url, "start", { method: "POST" })).toEqual({
      status: 502,
      body: { error: "The sign-in helper stopped unexpectedly", reason: "helper_failed" },
    });
    await runner!.close();

    await start(["--scenario=silent"], { timeouts: { startMs: 300 } });
    expect(await authCall(url, "start", { method: "POST" })).toEqual({
      status: 504,
      body: { error: "The sign-in helper did not answer in time", reason: "timeout" },
    });
    await waitUntil(async () => {
      const response = await fetch(url.replace(/^ws:/, "http:").replace(/\/acp$/, "/health"));
      return ((await response.json()) as { logins: number }).logins === 0;
    });
  });

  it("kills a sign-in that outlives its lifetime, and forgets results after a while", async () => {
    await start([], { timeouts: { lifetimeMs: 300, resultTtlMs: 600 } });
    const started = await authCall(url, "start", { method: "POST" });
    await waitUntil(async () => (await status(started.body.loginId)).body.status === "failed");
    expect((await status(started.body.loginId)).body).toEqual({ status: "failed", error: "The sign-in timed out" });
    // The helper got SIGTERM (it records that), i.e. it was cancelled, not left running.
    await waitUntil(() => existsSync(path.join(home(), "fake-login-cancelled")));
    await waitUntil(async () => (await status(started.body.loginId)).status === 404);
  });

  it("signs out: stops a pending sign-in and removes the stored one", async () => {
    await start();
    const started = await authCall(url, "start", { method: "POST" });
    mkdirSync(path.join(home(), ".codex"), { recursive: true });
    writeFileSync(path.join(home(), ".codex", "auth.json"), "{}");
    expect(await authCall(url, "logout", { method: "POST" })).toEqual({
      status: 200,
      body: { status: "disconnected" },
    });
    expect(existsSync(path.join(home(), ".codex", "auth.json"))).toBe(false);
    expect((await status(started.body.loginId)).body).toEqual({ status: "failed", error: "Signed out" });
    const record = JSON.parse(readFileSync(path.join(home(), "fake-login-logout.json"), "utf8")) as { args: string[] };
    expect(record.args.slice(-2)).toEqual(["codex", "logout"]);
  });

  it("reports whether the stored sign-in is still there", async () => {
    await start();
    expect(await authCall(url, "account")).toEqual({ status: 200, body: { connected: false } });
    mkdirSync(path.join(home(), ".codex"), { recursive: true });
    writeFileSync(path.join(home(), ".codex", "auth.json"), "{}");
    expect(await authCall(url, "account")).toEqual({
      status: 200,
      body: { connected: true, account: { email: "ada@example.com" } },
    });
    // Another user's home is a different sign-in.
    expect((await authCall(url, "account", { claims: { userId: OTHER_USER_ID } })).body).toEqual({ connected: false });
  });

  it("reports a sign-in check the helper could not answer", async () => {
    await start(["--scenario=status-fail"]);
    const result = await authCall(url, "account");
    expect(result.status).toBe(502);
    expect(result.body).toMatchObject({ reason: "helper_failed" });
  });

  it("reports a failed sign-out", async () => {
    await start(["--scenario=logout-fail"]);
    expect(await authCall(url, "logout", { method: "POST" })).toEqual({
      status: 502,
      body: { error: "could not remove the files", reason: "helper_failed" },
    });
  });
});

describe("Google sign-in (gemini)", () => {
  const claims = { adapter: "gemini" };

  it("takes the pasted code; a wrong code fails the sign-in", async () => {
    await start();
    const first = await authCall(url, "start", { method: "POST", claims });
    expect(first.body).toEqual({
      loginId: expect.any(String),
      verificationUrl: expect.stringMatching(/^https:\/\/accounts\.google\.com\//),
      needsCode: true,
    });
    const rejected = await authCall(url, "complete", { body: { loginId: first.body.loginId, code: "bad" }, claims });
    expect(rejected).toEqual({ status: 200, body: { status: "failed", error: "The code was not accepted" } });

    const second = await authCall(url, "start", { method: "POST", claims });
    for (const code of ["", "   ", "x".repeat(2049), 42]) {
      const invalid = await authCall(url, "complete", { body: { loginId: second.body.loginId, code }, claims });
      expect(invalid.status).toBe(400);
    }
    const accepted = await authCall(url, "complete", {
      body: { loginId: second.body.loginId, code: "  good-code  " },
      claims,
    });
    expect(accepted).toEqual({ status: 200, body: { status: "connected", account: { email: "ada@example.com" } } });
    expect(existsSync(path.join(home(), ".gemini", "oauth_creds.json"))).toBe(true);
    // A finished sign-in answers with its result.
    const again = await authCall(url, "complete", {
      body: { loginId: second.body.loginId, code: "good-code" },
      claims,
    });
    expect(again.body).toEqual({ status: "connected", account: { email: "ada@example.com" } });
  });
});

describe("sign-in isolation", () => {
  it("runs the helper as the dir's uid in its own process group", async () => {
    const spawned: SpawnOptions[] = [];
    const signalled: [number, string][] = [];
    await start(["--connect-after=100"], {
      isolation: "uid",
      chown: async () => undefined,
      spawner: (command, args, options) => {
        spawned.push(options);
        const { uid: _uid, gid: _gid, ...rest } = options;
        return spawn(command, args, rest);
      },
      killer: (pid, signal) => {
        signalled.push([pid, signal]);
        if (Math.abs(pid) < 900_000) defaultKiller(pid, signal);
      },
      listProcesses: async () => [{ pid: 900_001, uid: 20_000 }],
    });
    const started = await authCall(url, "start", { method: "POST" });
    expect(started.status).toBe(200);
    expect(spawned[0]).toMatchObject({ uid: 20_000, gid: 20_000, detached: true });
    expect(spawned[0]!.env).toMatchObject({ HOME: home(), USER: "plane-agent-20000" });
    await waitUntil(async () => (await status(started.body.loginId)).body.status === "connected");
    // Once the helper is gone, the group is killed and the idle uid reaped.
    await waitUntil(() => signalled.some(([pid]) => pid === 900_001));
  });
});

describe("helper events", () => {
  it("parses only the documented events", () => {
    expect(
      parseHelperEvent('{"event":"pending","verificationUrl":"https://x.test/a","userCode":"C","needsCode":false}')
    ).toEqual({ event: "pending", verificationUrl: "https://x.test/a", userCode: "C", needsCode: false });
    expect(
      parseHelperEvent('{"event":"pending","verificationUrl":"javascript:alert(1)","needsCode":true}')
    ).toBeUndefined();
    expect(parseHelperEvent('{"event":"connected","account":{"email":"a@b.c","token":"secret"}}')).toEqual({
      event: "connected",
      account: { email: "a@b.c" },
    });
    expect(parseHelperEvent('{"event":"failed"}')).toEqual({ event: "failed", error: "The sign-in failed" });
    expect(parseHelperEvent('{"event":"disconnected"}')).toEqual({ event: "disconnected" });
    expect(parseHelperEvent('{"event":"status","connected":true}')).toEqual({ event: "status", connected: true });
    for (const line of ["", "nope", "[]", "null", '{"event":"other"}']) expect(parseHelperEvent(line)).toBeUndefined();
  });
});

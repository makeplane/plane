/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* oxlint-disable no-await-in-loop -- requests in order */
import { afterEach, describe, expect, it } from "vitest";

import { runnerHttpUrl } from "../src/config.ts";
import { RateLimiter } from "../src/connections.ts";
import { createPlaneApi } from "../src/plane-api.ts";
import { AgentBridge } from "../src/server.ts";
import { FakeTransport } from "./helpers/fake-agent.ts";
import { ORIGIN, RecordingLogger, startHarness, testConfig, type Harness } from "./helpers/harness.ts";
import {
  OUTSIDER_COOKIE,
  StubPlaneApi,
  USER_COOKIE,
  USER_ID,
  WORKSPACE_ID,
  WORKSPACE_SLUG,
} from "./helpers/stub-api.ts";

let harness: Harness | undefined;
afterEach(async () => {
  await harness?.stop();
  harness = undefined;
});

const base = "/agents/connections";
const workspace = WORKSPACE_SLUG;

describe("ChatGPT sign-in (openai)", () => {
  it("starts with a login ticket, polls, and records the account once connected", async () => {
    harness = await startHarness();
    const started = await harness.http(`${base}/openai/start`, { body: { workspace } });
    expect(started.status).toBe(200);
    expect(started.body).toEqual({
      loginId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      verificationUrl: "https://auth.openai.com/codex/device",
      userCode: "WXYZ-9876",
      needsCode: false,
    });
    expect(started.headers.get("cache-control")).toBe("no-store");
    const [call] = harness.runner.calls;
    expect(call!.route).toBe("start");
    expect(call!.ticket).toMatchObject({
      adapter: "codex",
      env: {},
      initialMode: "ask_all",
      purpose: "login",
      userId: USER_ID,
      workspaceId: WORKSPACE_ID,
    });

    const loginId = started.body.loginId as string;
    const pending = await harness.http(`${base}/openai/status?workspace=${workspace}&loginId=${loginId}`);
    expect(pending).toMatchObject({ status: 200, body: { status: "pending" } });
    expect(harness.api.connections).toEqual([]);

    harness.runner.connect();
    const connected = await harness.http(`${base}/openai/status?workspace=${workspace}&loginId=${loginId}`);
    expect(connected).toMatchObject({
      status: 200,
      body: { status: "connected", account: { email: "ada@example.com", plan: "plus" } },
    });
    expect(harness.api.connections).toEqual([
      {
        method: "PUT",
        body: {
          user_id: USER_ID,
          workspace_slug: WORKSPACE_SLUG,
          provider: "openai",
          method: "chatgpt",
          account_label: "ada@example.com",
        },
      },
    ]);
  });

  it("reports a sign-in the user does not own as unknown", async () => {
    harness = await startHarness();
    const unknown = await harness.http(
      `${base}/openai/status?workspace=${workspace}&loginId=00000000-0000-4000-8000-000000000000`
    );
    expect(unknown).toMatchObject({ status: 404, body: { error: "Unknown sign-in" } });
    // A loginId started for Google is not an OpenAI sign-in.
    const google = await harness.http(`${base}/google/start`, { body: { workspace } });
    const crossed = await harness.http(`${base}/openai/status?workspace=${workspace}&loginId=${google.body.loginId}`);
    expect(crossed.status).toBe(404);
  });

  it("does not record anything when saving fails, and says so", async () => {
    harness = await startHarness();
    const started = await harness.http(`${base}/openai/start`, { body: { workspace } });
    harness.runner.connect();
    harness.api.connectionsStatus = 500;
    const failed = await harness.http(`${base}/openai/status?workspace=${workspace}&loginId=${started.body.loginId}`);
    expect(failed).toMatchObject({ status: 502, body: { error: "The Plane API is unavailable" } });
  });

  it("passes the helper's own failure through", async () => {
    harness = await startHarness();
    harness.runner.scripted.set("start", {
      status: 502,
      body: { error: "Device code sign-in is disabled for this account", reason: "helper_failed" },
    });
    expect(await harness.http(`${base}/openai/start`, { body: { workspace } })).toMatchObject({
      status: 502,
      body: { error: "Device code sign-in is disabled for this account" },
    });
    harness.runner.scripted.set("start", { status: 503, body: { error: "internal detail", reason: "other" } });
    expect(await harness.http(`${base}/openai/start`, { body: { workspace } })).toMatchObject({
      status: 502,
      body: { error: "The agent runner is unavailable" },
    });
  });
});

describe("Google sign-in (google)", () => {
  it("takes the pasted code and records the account", async () => {
    harness = await startHarness();
    const started = await harness.http(`${base}/google/start`, { body: { workspace } });
    expect(started.body).toEqual({
      loginId: expect.any(String),
      verificationUrl: expect.stringMatching(/^https:\/\/accounts\.google\.com\//),
      needsCode: true,
    });
    expect(harness.runner.calls[0]!.ticket.adapter).toBe("gemini");

    const loginId = started.body.loginId as string;
    const completed = await harness.http(`${base}/google/complete`, {
      body: { workspace, loginId, code: "  good-code\n" },
    });
    expect(completed).toMatchObject({
      status: 200,
      body: { status: "connected", account: { email: "ada@example.com" } },
    });
    expect(harness.runner.calls.at(-1)!.body).toEqual({ loginId, code: "good-code" });
    expect(harness.api.connections).toEqual([
      {
        method: "PUT",
        body: {
          user_id: USER_ID,
          workspace_slug: WORKSPACE_SLUG,
          provider: "google",
          method: "google_account",
          account_label: "ada@example.com",
        },
      },
    ]);
  });

  it("reports a rejected code without recording anything", async () => {
    harness = await startHarness();
    const started = await harness.http(`${base}/google/start`, { body: { workspace } });
    const completed = await harness.http(`${base}/google/complete`, {
      body: { workspace, loginId: started.body.loginId, code: "wrong" },
    });
    expect(completed).toMatchObject({ status: 200, body: { status: "failed", error: "The code was not accepted" } });
    expect(harness.api.connections).toEqual([]);
  });

  it("validates the code and loginId", async () => {
    harness = await startHarness();
    const started = await harness.http(`${base}/google/start`, { body: { workspace } });
    const loginId = started.body.loginId as string;
    for (const body of [
      { workspace, loginId },
      { workspace, loginId, code: "   " },
      { workspace, loginId, code: 7 },
      { workspace, loginId, code: "x".repeat(2049) },
      { workspace, loginId: "nope", code: "good-code" },
    ]) {
      expect((await harness.http(`${base}/google/complete`, { body })).status, JSON.stringify(body)).toBe(400);
    }
    // ChatGPT sign-ins take no code; the runner's refusal reaches the browser as 400.
    const openai = await harness.http(`${base}/openai/start`, { body: { workspace } });
    const refused = await harness.http(`${base}/openai/complete`, {
      body: { workspace, loginId: openai.body.loginId, code: "x" },
    });
    expect(refused).toMatchObject({ status: 400, body: { error: "This sign-in does not take a code" } });
  });
});

describe("disconnect", () => {
  it("signs out on the runner, then removes the credential", async () => {
    harness = await startHarness();
    const response = await harness.http(`${base}/google/disconnect`, { body: { workspace } });
    expect(response.status).toBe(204);
    expect(harness.runner.calls.map((call) => [call.route, call.ticket.adapter])).toEqual([["logout", "gemini"]]);
    expect(harness.api.connections).toEqual([
      { method: "DELETE", body: { user_id: USER_ID, workspace_slug: WORKSPACE_SLUG, provider: "google" } },
    ]);
  });

  it("keeps the credential when the runner could not sign out", async () => {
    harness = await startHarness();
    harness.runner.scripted.set("logout", {
      status: 502,
      body: { error: "Could not remove the sign-in", reason: "helper_failed" },
    });
    const response = await harness.http(`${base}/openai/disconnect`, { body: { workspace } });
    expect(response).toMatchObject({ status: 502, body: { error: "Could not remove the sign-in" } });
    expect(harness.api.connections).toEqual([]);
  });
});

describe("refusals", () => {
  it("checks the origin before anything else", async () => {
    harness = await startHarness();
    const response = await harness.http(`${base}/openai/start`, {
      body: { workspace },
      origin: "https://evil.example",
    });
    expect(response).toMatchObject({ status: 403, body: { error: "Origin not allowed" } });
    // A cross-site GET (an <img>, a link) carries no Origin, but its fetch metadata gives it away.
    const sneaky = await harness.http(`${base}/openai/status?workspace=${workspace}&loginId=x`, {
      origin: null,
      headers: { "Sec-Fetch-Site": "cross-site" },
    });
    expect(sneaky.status).toBe(403);
    expect(harness.runner.calls).toEqual([]);
  });

  it("requires a signed-in member", async () => {
    harness = await startHarness();
    expect(await harness.http(`${base}/openai/start`, { body: { workspace }, cookie: null })).toMatchObject({
      status: 401,
      body: { error: "Not signed in" },
    });
    expect(
      (await harness.http(`${base}/openai/start`, { body: { workspace }, cookie: "session-id=forged" })).status
    ).toBe(401);
    expect(await harness.http(`${base}/openai/start`, { body: { workspace }, cookie: OUTSIDER_COOKIE })).toMatchObject({
      status: 403,
      body: { error: "Not a member of this workspace" },
    });
    expect((await harness.http(`${base}/openai/start`, { body: { workspace: "other" } })).status).toBe(403);
    expect(harness.runner.calls).toEqual([]);
  });

  it("validates the input", async () => {
    harness = await startHarness();
    const cases: [string, Parameters<Harness["http"]>[1]][] = [
      [`${base}/anthropic/start`, { body: { workspace } }],
      [`${base}/deepseek/start`, { body: { workspace } }],
      [`${base}/openai/start`, { body: {} }],
      [`${base}/openai/start`, { body: { workspace: "../etc" } }],
      [`${base}/openai/start`, { rawBody: JSON.stringify({ workspace }), contentType: "text/plain" }],
      [`${base}/openai/start`, { rawBody: JSON.stringify({ workspace }), contentType: null }],
      [`${base}/openai/start`, { rawBody: "{not json" }],
      [`${base}/openai/status?workspace=${workspace}`, {}],
      [`${base}/openai/status?workspace=${workspace}&loginId=../x`, {}],
    ];
    for (const [path, options] of cases) {
      const response = await harness.http(path, options);
      expect(response.status, `${path} ${JSON.stringify(options)}`).toBe(400);
      expect(typeof response.body.error).toBe("string");
    }
    expect((await harness.http(`${base}/openai/delete`, { body: { workspace } })).status).toBe(404);
    expect((await harness.http(`${base}/openai/start`)).status).toBe(404);
    expect(harness.runner.calls).toEqual([]);
  });

  it("rate limits sign-in starts per user", async () => {
    harness = await startHarness({ config: { loginStartLimit: 2 } });
    expect((await harness.http(`${base}/openai/start`, { body: { workspace } })).status).toBe(200);
    expect((await harness.http(`${base}/google/start`, { body: { workspace } })).status).toBe(200);
    const limited = await harness.http(`${base}/openai/start`, { body: { workspace } });
    expect(limited).toMatchObject({ status: 429, body: { error: expect.any(String) } });
    expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0);
    // Polling is not limited.
    const [loginId] = harness.runner.latest();
    expect((await harness.http(`${base}/google/status?workspace=${workspace}&loginId=${loginId}`)).status).toBe(200);
  });

  it("answers 502 when the runner is down or rejects the bridge's tickets", async () => {
    harness = await startHarness({ config: { runnerHttpUrl: "http://127.0.0.1:1" } });
    expect(await harness.http(`${base}/openai/start`, { body: { workspace } })).toMatchObject({
      status: 502,
      body: { error: "The agent runner is unavailable" },
    });
    await harness.stop();

    harness = await startHarness({ config: { runnerSecret: "x".repeat(40) } });
    expect(await harness.http(`${base}/openai/start`, { body: { workspace } })).toMatchObject({
      status: 502,
      body: { error: "The sign-in service is misconfigured" },
    });
    expect(harness.log.text()).toContain("check AGENT_RUNNER_SECRET");
  });

  it("answers 502 when the API rejects the bridge secret", async () => {
    const api = await new StubPlaneApi().start();
    const log = new RecordingLogger();
    const bridge = new AgentBridge({
      config: testConfig({ apiBaseUrl: api.url }),
      api: createPlaneApi({ baseUrl: api.url, bridgeSecret: "wrong" }),
      transport: new FakeTransport(),
      log,
    });
    const { port } = await bridge.listen(0, "127.0.0.1");
    try {
      const response = await fetch(`http://127.0.0.1:${port}${base}/openai/start`, {
        method: "POST",
        headers: { Cookie: USER_COOKIE, Origin: ORIGIN, "Content-Type": "application/json" },
        body: JSON.stringify({ workspace }),
      });
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ error: "The sign-in service is misconfigured" });
      expect(log.text()).toContain("rejected AGENT_BRIDGE_SECRET");
    } finally {
      await bridge.close();
      await api.stop();
    }
  });
});

describe("CORS", () => {
  it("answers preflights and requests for allowed origins, with credentials", async () => {
    harness = await startHarness({ config: { allowedOrigins: ["http://localhost:3000"] } });
    const preflight = await fetch(`${harness.baseUrl.replace("ws:", "http:")}${base}/openai/start`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
    expect(preflight.headers.get("access-control-allow-credentials")).toBe("true");
    expect(preflight.headers.get("access-control-allow-methods")).toContain("POST");
    expect(preflight.headers.get("access-control-allow-headers")?.toLowerCase()).toContain("content-type");

    const response = await harness.http(`${base}/openai/start`, {
      body: { workspace },
      origin: "http://localhost:3000",
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
    expect(response.headers.get("vary")).toContain("Origin");

    const refused = await fetch(`${harness.baseUrl.replace("ws:", "http:")}${base}/openai/start`, {
      method: "OPTIONS",
      headers: { Origin: "https://evil.example", "Access-Control-Request-Method": "POST" },
    });
    expect(refused.status).toBe(403);
    expect(refused.headers.get("access-control-allow-origin")).toBeNull();
  });
});

describe("logging", () => {
  it("never logs cookies, tickets, verification URLs or codes", async () => {
    harness = await startHarness();
    const started = await harness.http(`${base}/google/start`, { body: { workspace } });
    await harness.http(`${base}/google/complete`, {
      body: { workspace, loginId: started.body.loginId, code: "good-code" },
    });
    const openai = await harness.http(`${base}/openai/start`, { body: { workspace } });
    harness.runner.connect();
    await harness.http(`${base}/openai/status?workspace=${workspace}&loginId=${openai.body.loginId}`);
    await harness.http(`${base}/openai/disconnect`, { body: { workspace } });
    const text = harness.log.text();
    expect(text).toContain("provider account connected");
    for (const secret of [USER_COOKIE, "user-session", "good-code", "WXYZ-9876", "s3cr3t", "auth.openai.com", "v1."]) {
      expect(text).not.toContain(secret);
    }
  });
});

describe("helpers", () => {
  it("derives the runner's HTTP origin from its ACP URL", () => {
    expect(runnerHttpUrl("ws://agent-runner:3410/acp")).toBe("http://agent-runner:3410");
    expect(runnerHttpUrl("wss://runner.internal/prefix/acp")).toBe("https://runner.internal/prefix");
    expect(runnerHttpUrl("ws://agent-runner:3410/acp", "http://other:1/")).toBe("http://other:1");
  });

  it("limits per key in a sliding window", () => {
    const limiter = new RateLimiter(2, 1_000);
    expect(limiter.take("a", 0).ok).toBe(true);
    expect(limiter.take("a", 100).ok).toBe(true);
    expect(limiter.take("a", 200)).toEqual({ ok: false, retryAfterMs: 800 });
    expect(limiter.take("b", 200).ok).toBe(true);
    expect(limiter.take("a", 1_001).ok).toBe(true);
  });
});

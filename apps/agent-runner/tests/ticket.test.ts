/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { afterEach, describe, expect, it } from "vitest";

import type { AgentRunner } from "../src/server.ts";
import { acpClient, startRunner, tempRoot, ticket, upgradeStatus, waitUntil } from "./helpers.ts";

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

let runner: AgentRunner | undefined;
afterEach(async () => {
  await runner?.close();
  runner = undefined;
});

describe("spawn ticket verification", () => {
  it("accepts a valid ticket and serves the agent over ACP", async () => {
    const started = await startRunner(tempRoot());
    runner = started.runner;
    const client = acpClient(started.url, { Authorization: `Bearer ${ticket()}` });
    const init = await client.agent.request("initialize", { protocolVersion: 1 });
    expect(init.agentInfo?.name).toBe("plane-acp-echo");
    expect(runner.agents()).toHaveLength(1);
    client.close();
    await waitUntil(() => runner!.agents().length === 0);
  });

  it("refuses missing, expired, tampered, foreign and replayed tickets", async () => {
    const started = await startRunner(tempRoot());
    runner = started.runner;
    expect(await upgradeStatus(started.url, {})).toBe(401);
    expect(await upgradeStatus(started.url, bearer("garbage"))).toBe(401);
    expect(await upgradeStatus(started.url, bearer(ticket({}, { now: Date.now() - 120_000 })))).toBe(401);

    const [version, payload, signature] = ticket().split(".") as [string, string, string];
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
    claims.initialMode = "yolo";
    const tampered = [version, Buffer.from(JSON.stringify(claims)).toString("base64url"), signature].join(".");
    expect(await upgradeStatus(started.url, bearer(tampered))).toBe(401);

    const { signSpawnTicket } = await import("@plane/agent-runner-protocol");
    const foreign = signSpawnTicket(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")), "x".repeat(40));
    expect(await upgradeStatus(started.url, bearer(foreign))).toBe(401);

    const once = ticket();
    expect(await upgradeStatus(started.url, bearer(once))).toBe(101);
    expect(await upgradeStatus(started.url, bearer(once))).toBe(401);
  });

  it("only starts known adapters, and echo only when enabled", async () => {
    const started = await startRunner(tempRoot(), { config: { enableEcho: false } });
    runner = started.runner;
    expect(await upgradeStatus(started.url, bearer(ticket({ adapter: "echo" })))).toBe(400);
    expect(await upgradeStatus(started.url, bearer(ticket({ adapter: "bash" })))).toBe(400);
    expect(runner.agents()).toHaveLength(0);
  });

  it("serves health and nothing else over HTTP", async () => {
    const started = await startRunner(tempRoot());
    runner = started.runner;
    const base = started.url.replace("ws:", "http:").replace(/\/acp$/, "");
    expect(await (await fetch(`${base}/health`)).json()).toMatchObject({ status: "OK", agents: 0 });
    expect((await fetch(`${base}/acp`)).status).toBe(404);
  });
});

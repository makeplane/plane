/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it, vi } from "vitest";
import { AgentConnectionError, AgentConnectionService, agentBridgeHttpUrl } from "./agent-connection.service";

const json = (status: number, body: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("agentBridgeHttpUrl", () => {
  it.each([
    ["", "/agents", "/agents/connections/openai/start"],
    [undefined, undefined, "/agents/connections/openai/start"],
    [
      "https://bridge.example.com/ignored/path",
      "/agents/",
      "https://bridge.example.com/agents/connections/openai/start",
    ],
    ["http://localhost:8787", "bridge", "http://localhost:8787/bridge/connections/openai/start"],
  ])("builds the URL from base %j and path %j", (baseUrl, basePath, expected) => {
    expect(agentBridgeHttpUrl(baseUrl, basePath, "/connections/openai/start")).toBe(expected);
  });
});

describe("AgentConnectionService", () => {
  it("checks a stored sign-in with a GET that carries the workspace and the cookie", async () => {
    const fetch = vi.fn(async () => json(200, { connected: false }));
    const service = new AgentConnectionService({ baseUrl: "", basePath: "/agents", fetch });
    await expect(service.account("google", "acme")).resolves.toEqual({ connected: false });
    expect(fetch).toHaveBeenCalledWith(
      "/agents/connections/google/account?workspace=acme",
      expect.objectContaining({ method: "GET", credentials: "include" })
    );
  });

  it("starts a sign-in with a JSON POST that carries the session cookie", async () => {
    const fetch = vi.fn(async () =>
      json(200, {
        loginId: "l1",
        verificationUrl: "https://auth.openai.com/codex/device",
        userCode: "AB-12",
        needsCode: false,
      })
    );
    const service = new AgentConnectionService({ baseUrl: "", basePath: "/agents", fetch });
    await expect(service.start("openai", "acme")).resolves.toEqual({
      loginId: "l1",
      verificationUrl: "https://auth.openai.com/codex/device",
      userCode: "AB-12",
      needsCode: false,
    });
    expect(fetch).toHaveBeenCalledWith("/agents/connections/openai/start", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace: "acme" }),
    });
  });

  it("asks for the status with the workspace and login id in the query", async () => {
    const fetch = vi.fn(async () => json(200, { status: "pending" }));
    const service = new AgentConnectionService({ baseUrl: "", basePath: "/agents", fetch });
    await expect(service.status("google", "acme", "l 1")).resolves.toEqual({ status: "pending" });
    expect(fetch).toHaveBeenCalledWith("/agents/connections/google/status?workspace=acme&loginId=l+1", {
      method: "GET",
      credentials: "include",
      headers: {},
    });
  });

  it("sends the pasted code and returns the result", async () => {
    const fetch = vi.fn(async (_url: URL | RequestInfo, _init?: RequestInit) =>
      json(200, { status: "connected", account: { email: "a@b.c" } })
    );
    const service = new AgentConnectionService({ baseUrl: "", basePath: "/agents", fetch });
    await expect(service.complete("google", "acme", "l1", "4/abc")).resolves.toEqual({
      status: "connected",
      account: { email: "a@b.c" },
    });
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ workspace: "acme", loginId: "l1", code: "4/abc" }),
    });
  });

  it("accepts a 204 on disconnect", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    const service = new AgentConnectionService({ baseUrl: "", basePath: "/agents", fetch });
    await expect(service.disconnect("openai", "acme")).resolves.toBeUndefined();
  });

  it("throws the bridge's error message with the HTTP status", async () => {
    const fetch = vi.fn(async () => json(429, { error: "Too many sign-in attempts." }));
    const service = new AgentConnectionService({ baseUrl: "", basePath: "/agents", fetch });
    const error = await service.start("openai", "acme").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AgentConnectionError);
    expect(error).toMatchObject({ status: 429, message: "Too many sign-in attempts." });
  });

  it("reports an unreachable bridge as status 0", async () => {
    const fetch = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    const service = new AgentConnectionService({ baseUrl: "", basePath: "/agents", fetch });
    await expect(service.start("openai", "acme")).rejects.toMatchObject({ status: 0 });
  });
});

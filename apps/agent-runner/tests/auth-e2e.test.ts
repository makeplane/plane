/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { existsSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { AgentBridge, createPlaneApi, silentLogger, type AgentTransport, type BridgeConfig } from "agent-bridge";
import { afterEach, describe, expect, it } from "vitest";

import { SECRET, USER_ID, WORKSPACE_ID, startRunner, tempRoot } from "./helpers.ts";

const FIXTURE = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "fake-login.mjs");
const BRIDGE_SECRET = "bridge-secret";
const COOKIE = "session-id=abc";
const ORIGIN = "http://plane.test";

/** `/api/users/me/` and the internal agent-connections endpoints. */
async function stubApi() {
  const connections: { method: string; body: Record<string, string> }[] = [];
  const server: Server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const url = new URL(req.url ?? "/", "http://api");
      const send = (status: number, body?: unknown) => {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(body === undefined ? "" : JSON.stringify(body));
      };
      if (url.pathname === "/api/users/me/") {
        return req.headers.cookie === COOKIE ? send(200, { id: USER_ID }) : send(401, {});
      }
      if (req.headers["x-agent-bridge-secret"] !== BRIDGE_SECRET) return send(403, {});
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") as Record<string, string>;
      if (url.pathname === "/api/internal/agent-connections/authorize/") {
        return send(200, { user: { id: body.user_id }, workspace: { id: WORKSPACE_ID, slug: body.workspace_slug } });
      }
      connections.push({ method: req.method ?? "", body });
      return send(req.method === "DELETE" ? 204 : 200, req.method === "DELETE" ? undefined : {});
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    connections,
    stop: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}

const stops: (() => Promise<void>)[] = [];
afterEach(async () => {
  // oxlint-disable-next-line no-await-in-loop -- stop in reverse start order
  for (const stop of stops.splice(0).toReversed()) await stop();
});

describe("browser → bridge → runner → sign-in helper", () => {
  it("signs in with Google and out again, recording the account with the API", async () => {
    const root = tempRoot();
    const { runner, url: runnerUrl } = await startRunner(root, {
      loginHelper: { command: process.execPath, args: [FIXTURE] },
    });
    stops.push(() => runner.close());
    const api = await stubApi();
    stops.push(api.stop);
    const config: BridgeConfig = {
      version: "e2e",
      host: "127.0.0.1",
      port: 0,
      apiBaseUrl: api.url,
      bridgeSecret: BRIDGE_SECRET,
      runnerUrl,
      runnerSecret: SECRET,
      runnerHttpUrl: runnerUrl.replace(/^ws:/, "http:").replace(/\/acp$/, ""),
      basePath: "/agents",
      workspacesRoot: root,
      planeMcpUrl: "",
      allowedOrigins: [ORIGIN],
      maxMessageBytes: 1024 * 1024,
      maxAgentMessageBytes: 8 * 1024 * 1024,
      maxConnectionsPerUser: 2,
      maxConnections: 10,
      idleTimeoutMs: 60_000,
      pingIntervalMs: 30_000,
      loginStartLimit: 10,
      loginStartWindowMs: 60_000,
    };
    const unused: AgentTransport = {
      open: () => Promise.reject(new Error("no chats in this test")),
    };
    const bridge = new AgentBridge({
      config,
      api: createPlaneApi({ baseUrl: api.url, bridgeSecret: BRIDGE_SECRET }),
      transport: unused,
      log: silentLogger,
    });
    const { port } = await bridge.listen(0, "127.0.0.1");
    stops.push(() => bridge.close());

    const post = (route: string, body: unknown) =>
      fetch(`http://127.0.0.1:${port}/agents/connections/google/${route}`, {
        method: "POST",
        headers: { Cookie: COOKIE, Origin: ORIGIN, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

    const started = await post("start", { workspace: "acme" });
    expect(started.status).toBe(200);
    const { loginId, verificationUrl, needsCode } = (await started.json()) as Record<string, unknown>;
    expect(needsCode).toBe(true);
    expect(verificationUrl).toMatch(/^https:\/\/accounts\.google\.com\//);

    const completed = await post("complete", { workspace: "acme", loginId, code: "good-code" });
    expect(await completed.json()).toEqual({ status: "connected", account: { email: "ada@example.com" } });
    const creds = path.join(root, ".homes", WORKSPACE_ID, USER_ID, ".gemini", "oauth_creds.json");
    expect(existsSync(creds)).toBe(true);
    expect(api.connections).toEqual([
      {
        method: "PUT",
        body: {
          user_id: USER_ID,
          workspace_slug: "acme",
          provider: "google",
          method: "google_account",
          account_label: "ada@example.com",
        },
      },
    ]);

    const disconnected = await post("disconnect", { workspace: "acme" });
    expect(disconnected.status).toBe(204);
    expect(existsSync(creds)).toBe(false);
    expect(api.connections.at(-1)).toEqual({
      method: "DELETE",
      body: { user_id: USER_ID, workspace_slug: "acme", provider: "google" },
    });
  });
});

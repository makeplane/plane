/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: publishDocumentUpdate reaches an editor connected to another live instance through
// the Redis extension's channel. Runs against a real Redis (TEST_REDIS_URL), like the upstream
// tests/integration/hocuspocus-v3.test.ts it borrows its setup from.

import { once } from "node:events";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { Hocuspocus } from "@hocuspocus/server";
import RedisClient from "ioredis";
import { WebSocketServer } from "ws";
import * as Y from "yjs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Redis } from "@/extensions/redis";
import { drainCollaborationServer } from "@/lib/drain-server";
import { publishDocumentUpdate } from "@/liviere/redis-publish";

const redisState = vi.hoisted(() => ({ client: null as RedisClient | null }));
vi.mock("@/redis", () => ({ redisManager: { getClient: () => redisState.client } }));

const REDIS_URL = process.env.TEST_REDIS_URL;

describe.skipIf(!REDIS_URL)("publishDocumentUpdate across live instances", () => {
  const servers: Hocuspocus[] = [];
  const sockets: WebSocketServer[] = [];
  let provider: HocuspocusProvider | null = null;
  const document = new Y.Doc();

  beforeAll(async () => {
    redisState.client = new RedisClient(`${REDIS_URL}/4`);
    await once(redisState.client, "ready");
    for (let index = 0; index < 2; index++) {
      const server = new Hocuspocus({
        quiet: true,
        onAuthenticate: () => Promise.resolve({ documentType: "project_page" }),
        extensions: [new Redis()],
      });
      servers.push(server);
      const socket = new WebSocketServer({ host: "127.0.0.1", port: 0 });
      socket.on("connection", (ws, request) => server.handleConnection(ws, request));
      sockets.push(socket);
    }
    await Promise.all(sockets.map((socket) => once(socket, "listening")));
  });

  afterAll(async () => {
    provider?.destroy();
    document.destroy();
    try {
      await Promise.all(servers.map((server) => drainCollaborationServer(server, 10_000)));
    } finally {
      for (const socket of sockets) for (const client of socket.clients) client.terminate();
      await Promise.all(sockets.map((socket) => new Promise<void>((resolve) => socket.close(() => resolve()))));
      await redisState.client?.flushdb();
      redisState.client?.disconnect();
    }
  });

  it("delivers the update to an editor connected to the other instance", async () => {
    const port = (sockets[1].address() as { port: number }).port;
    provider = new HocuspocusProvider({ url: `ws://127.0.0.1:${port}`, name: "page-1", document, token: "t" });
    await vi.waitFor(() => expect(provider?.synced).toBe(true), { timeout: 10_000 });
    expect(servers[0].documents.has("page-1")).toBe(false);

    // The change Django asked for, computed elsewhere (see editStoredDocument)
    const change = new Y.Doc();
    const paragraph = new Y.XmlElement("paragraph");
    paragraph.insert(0, [new Y.XmlText("Written by the API")]);
    change.getXmlFragment("default").insert(0, [paragraph]);

    const receivers = await publishDocumentUpdate(servers[0], "page-1", Y.encodeStateAsUpdate(change));

    expect(receivers).toBeGreaterThanOrEqual(1);
    await vi.waitFor(() => expect(document.getXmlFragment("default").toString()).toContain("Written by the API"), {
      timeout: 10_000,
    });
  });
});

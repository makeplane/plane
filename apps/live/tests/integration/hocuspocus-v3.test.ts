/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { once } from "node:events";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { Hocuspocus } from "@hocuspocus/server";
import RedisClient from "ioredis";
import { WebSocketServer } from "ws";
import * as Y from "yjs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { TDocumentPayload } from "@plane/types";
import { Database } from "@/extensions/database";
import { Redis } from "@/extensions/redis";
import { TitleSyncExtension } from "@/extensions/title-sync";
import { drainCollaborationServer } from "@/lib/drain-server";

// Pages written by the v2 (Tiptap 2 / y-prosemirror) editor: a body + title page, and a body-only page from
// before titles moved into the Yjs document.
const V2_PAGE =
  "AhHv4/eICwAHAQdkZWZhdWx0AwlwYXJhZ3JhcGgHAO/j94gLAAYEAO/j94gLAQlFeGlzdGluZyCG7+P3iAsKBGJvbGQCe32E7+P3iAsLBGJvbGSG7+P3iAsPBGJvbGQEbnVsbITv4/eICxAFIGFuZCCG7+P3iAsVBml0YWxpYwJ7fYTv4/eICxYGaXRhbGljhu/j94gLHAZpdGFsaWMEbnVsbITv4/eICx0FIGJvZHmH7+P3iAsAAwh0YXNrTGlzdAcA7+P3iAsjAwh0YXNrSXRlbQcA7+P3iAskAwlwYXJhZ3JhcGgHAO/j94gLJQYEAO/j94gLJgRkb25lKADv4/eICyQHY2hlY2tlZAF4BJ7LvPcCAAcBBXRpdGxlAwdoZWFkaW5nBwCey7z3AgAGBACey7z3AgEYRXhpc3Rpbmcgd2lraSB0aXRsZSDwn5qAKACey7z3AgAFbGV2ZWwBfQEA";
const V2_PAGE_WITHOUT_TITLE =
  "AQOQj+TZDQAHAQdkZWZhdWx0AwlwYXJhZ3JhcGgHAJCP5NkNAAYEAJCP5NkNASdCb2R5IHNhdmVkIGJlZm9yZSB0aXRsZXMgbW92ZWQgaW50byBZanMA";

const redisState = vi.hoisted(() => ({ client: null as RedisClient | null }));
vi.mock("@/redis", () => ({ redisManager: { getClient: () => redisState.client } }));

// Only the API boundary is replaced; Plane's codecs, persistence and title hooks run unchanged.
const api = vi.hoisted(() => ({
  saved: new Map<string, Uint8Array>(),
  html: new Map<string, string>(),
  titles: new Map<string, string>(),
  details: new Map<string, { name: string; description_html?: string }>(),
}));
vi.mock("@/services/page/handler", () => ({
  getPageService: () => ({
    fetchDescriptionBinary: (id: string) => Promise.resolve(api.saved.get(id) ?? new Uint8Array()),
    fetchDetails: (id: string) => Promise.resolve(api.details.get(id) ?? { name: "" }),
    updateDescriptionBinary: (id: string, payload: TDocumentPayload) => {
      api.saved.set(id, Buffer.from(payload.description_binary!, "base64"));
      api.html.set(id, payload.description_html!);
      return Promise.resolve();
    },
    updatePageProperties: (id: string, { data }: { data: { name: string } }) => {
      api.titles.set(id, data.name);
      return Promise.resolve();
    },
  }),
}));

const REDIS_URL = process.env.TEST_REDIS_URL;

describe.skipIf(!REDIS_URL)("Hocuspocus v3 with Plane's Redis extension and v2 documents", () => {
  const servers: Hocuspocus[] = [];
  const sockets: WebSocketServer[] = [];
  const providers: HocuspocusProvider[] = [];
  const documents: Y.Doc[] = [];
  const extensions: Redis[] = [];
  const urls: string[] = [];
  const stateless: string[][] = [[], []];

  const connect = (index: number, name: string) => {
    const document = new Y.Doc();
    documents.push(document);
    const provider = new HocuspocusProvider({
      url: urls[index],
      name,
      document,
      token: "test-token",
      onStateless: ({ payload }) => stateless[index].push(payload),
    });
    providers.push(provider);
    return { document, provider };
  };

  const disconnectAll = async (name: string) => {
    for (const provider of providers.splice(0)) provider.destroy();
    await vi.waitFor(() => expect(servers.every((server) => !server.documents.has(name))).toBe(true), {
      timeout: 10_000,
    });
  };

  const savedDoc = (name: string) => {
    const doc = new Y.Doc();
    Y.applyUpdate(doc, api.saved.get(name)!);
    return doc;
  };

  beforeAll(async () => {
    // a non-zero DB checks that Redis locks run on the configured database
    redisState.client = new RedisClient(`${REDIS_URL}/3`);
    await once(redisState.client, "ready");
    api.saved.set("v2-page", Buffer.from(V2_PAGE, "base64"));
    api.saved.set("v2-page-without-title", Buffer.from(V2_PAGE_WITHOUT_TITLE, "base64"));
    api.details.set("v2-page-without-title", { name: "Migrated title" });
    api.details.set("html-only-page", { name: "HTML page", description_html: "<p>Saved as <strong>HTML</strong></p>" });

    for (let index = 0; index < 2; index++) {
      const redis = new Redis();
      extensions.push(redis);
      const server = new Hocuspocus({
        quiet: true,
        onAuthenticate: () =>
          Promise.resolve({
            documentType: "project_page",
            workspaceSlug: "w",
            projectId: "p",
            userId: "u",
            cookie: "c",
          }),
        debounce: 20,
        maxDebounce: 100,
        extensions: [redis, new Database(), new TitleSyncExtension()],
      });
      servers.push(server);
      const socket = new WebSocketServer({ host: "127.0.0.1", port: 0 });
      socket.on("connection", (ws, request) => server.handleConnection(ws, request));
      sockets.push(socket);
    }
    await Promise.all(sockets.map((socket) => once(socket, "listening")));
    urls.push(...sockets.map((socket) => `ws://127.0.0.1:${(socket.address() as { port: number }).port}`));
  });

  afterAll(async () => {
    for (const provider of providers) provider.destroy();
    for (const document of documents) document.destroy();
    try {
      await Promise.all(servers.map((server) => drainCollaborationServer(server, 10_000)));
    } finally {
      for (const socket of sockets) for (const client of socket.clients) client.terminate();
      await Promise.all(sockets.map((socket) => new Promise<void>((resolve) => socket.close(() => resolve()))));
      await redisState.client?.flushdb();
      redisState.client?.disconnect();
    }
  });

  it("preserves a v2 body and title, syncs edits across servers, broadcasts, and saves on unload", async () => {
    const first = connect(0, "v2-page");
    const second = connect(1, "v2-page");
    await vi.waitFor(() => expect(first.provider.isSynced && second.provider.isSynced).toBe(true), {
      timeout: 10_000,
    });
    expect(second.document.getXmlFragment("default").toJSON()).toContain("<bold>bold</bold>");
    expect(second.document.getXmlFragment("title").toJSON()).toContain("Existing wiki title 🚀");

    const text = (first.document.getXmlFragment("default").get(0) as Y.XmlElement).get(0) as Y.XmlText;
    text.insert(text.length, " v3 edit");
    await vi.waitFor(() => expect(second.document.getXmlFragment("default").toJSON()).toContain("v3 edit"));

    await extensions[0].broadcastToDocument("v2-page", { migrationTest: true });
    await vi.waitFor(() =>
      expect(stateless.every((messages) => messages.includes('{"migrationTest":true}'))).toBe(true)
    );

    const direct = await servers[0].openDirectConnection("v2-page", {
      documentType: "project_page",
      workspaceSlug: "w",
      projectId: "p",
      userId: "u",
      cookie: "c",
    });
    await direct.transact((doc) => {
      const title = (doc.getXmlFragment("title").get(0) as Y.XmlElement).get(0) as Y.XmlText;
      title.insert(title.length, " updated");
    });
    await direct.disconnect();
    await vi.waitFor(() => expect(second.document.getXmlFragment("title").toJSON()).toContain("updated"));

    await disconnectAll("v2-page");
    const restored = savedDoc("v2-page");
    try {
      expect(restored.getXmlFragment("default").toJSON()).toContain("v3 edit");
      expect(restored.getXmlFragment("title").toJSON()).toContain("updated");
      expect(api.html.get("v2-page")).toContain("v3 edit");
      expect(api.html.get("v2-page")).toContain('data-checked="true"');
      expect(api.titles.get("v2-page")).toBe("Existing wiki title 🚀 updated");
    } finally {
      restored.destroy();
    }
  });

  it("adds the stored title to a v2 page that has none", async () => {
    const { document, provider } = connect(0, "v2-page-without-title");
    await vi.waitFor(() => expect(provider.isSynced).toBe(true), { timeout: 10_000 });
    expect(document.getXmlFragment("title").toJSON()).toContain("Migrated title");
    expect(document.getXmlFragment("default").toJSON()).toContain("Body saved before titles moved into Yjs");
    await disconnectAll("v2-page-without-title");
  });

  it("converts an HTML-only page to Yjs on the server and saves it back", async () => {
    const { document, provider } = connect(1, "html-only-page");
    await vi.waitFor(() => expect(provider.isSynced).toBe(true), { timeout: 10_000 });
    expect(document.getXmlFragment("default").toJSON()).toContain("<bold>HTML</bold>");
    expect(document.getXmlFragment("title").toJSON()).toContain("HTML page");
    expect(api.html.get("html-only-page")).toBe('<p class="editor-paragraph-block">Saved as <strong>HTML</strong></p>');
    await disconnectAll("html-only-page");
  });
});

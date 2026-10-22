/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const SECRET = vi.hoisted(() => {
  process.env.API_BASE_URL ??= "http://localhost:8000";
  process.env.LIVE_SERVER_SECRET_KEY = "unit-test-live-secret";
  return process.env.LIVE_SERVER_SECRET_KEY;
});

const { registerController } = await import("@plane/decorators");
const { DocumentController } = await import("@/controllers/document.controller");

describe("POST /convert-document/", () => {
  let server: Server;
  let url: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    const router = express.Router();
    registerController(router, DocumentController);
    app.use(router);
    server = await new Promise<Server>((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/convert-document/`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  const post = (headers: Record<string, string> = {}) =>
    fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify({ description_html: "<p>hello</p>", variant: "document" }),
    });

  it("returns 401 without the secret key header", async () => {
    expect((await post()).status).toBe(401);
  });

  it("returns 401 with a wrong secret key", async () => {
    expect((await post({ "live-server-secret-key": "wrong-key" })).status).toBe(401);
  });

  it("converts the document with the header the API sends", async () => {
    const response = await post({ "live-server-secret-key": SECRET });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { description_json?: unknown; description_binary?: unknown };
    expect(body.description_json).toBeDefined();
    expect(body.description_binary).toBeDefined();
  });
});

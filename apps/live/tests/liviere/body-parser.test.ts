/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { liviereJsonParser } from "@/liviere/body-parser";

vi.mock("@/env", () => ({ env: { LIVE_SERVER_SECRET_KEY: "secret" } }));

describe("liviereJsonParser", () => {
  let server: Server;
  let url: string;
  // A page edit request above express.json()'s default 100 kB limit
  const body = JSON.stringify({ description_binary: "A".repeat(300_000) });

  beforeAll(async () => {
    // Same order as LiveServer.setupMiddleware
    const app = express();
    app.use("/live/liviere", liviereJsonParser);
    app.use(express.json());
    app.post("/live/liviere/page-edit/", (req, res) => {
      res.json({ size: (req.body as { description_binary: string }).description_binary.length });
    });
    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/live/liviere/page-edit/`;
  });

  afterAll(() => {
    server.close();
  });

  const post = (key?: string) =>
    fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...(key ? { "live-server-secret-key": key } : {}) },
      body,
    });

  it("accepts a large body with the live server secret", async () => {
    const response = await post("secret");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ size: 300_000 });
  });

  it("keeps the default limit without the secret or with a wrong one", async () => {
    expect((await post()).status).toBe(413);
    expect((await post("wrong-secret")).status).toBe(413);
  });
});

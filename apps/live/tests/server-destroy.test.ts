/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  drain: vi.fn<() => Promise<void>>(),
  redisDisconnect: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/env", () => ({
  env: {
    PORT: 0,
    LIVE_BASE_PATH: "/live",
    COMPRESSION_LEVEL: 6,
    COMPRESSION_THRESHOLD: 1024,
    CORS_ALLOWED_ORIGINS: "",
  },
}));
vi.mock("@/controllers", () => ({ CONTROLLERS: [] }));
vi.mock("@/hocuspocus", () => ({ HocusPocusServerManager: { getInstance: vi.fn() } }));
vi.mock("@/redis", () => ({ redisManager: { disconnect: mocks.redisDisconnect } }));
vi.mock("@/lib/drain-server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/drain-server")>()),
  drainCollaborationServer: mocks.drain,
}));

const { Server } = await import("@/server");

function serverWith(closeError?: Error) {
  const server = new Server();
  Object.assign(server, {
    hocuspocusServer: { closeConnections: vi.fn() },
    httpServer: { close: (callback: (error?: Error) => void) => setTimeout(() => callback(closeError), 0) },
  });
  return server;
}

describe("Server.destroy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps draining when the HTTP server fails to close", async () => {
    let drained = false;
    mocks.drain.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      drained = true;
    });
    await expect(serverWith(new Error("ERR_SERVER_NOT_RUNNING")).destroy()).resolves.toBeUndefined();
    expect(drained).toBe(true);
    expect(mocks.redisDisconnect).toHaveBeenCalledOnce();
  });

  it("still disconnects Redis and rejects when the drain fails", async () => {
    mocks.drain.mockRejectedValue(new Error("Failed to persist 1 document(s) during shutdown: wiki"));
    await expect(serverWith().destroy()).rejects.toThrow("Failed to persist 1 document(s)");
    expect(mocks.redisDisconnect).toHaveBeenCalledOnce();
  });
});

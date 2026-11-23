/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { EventEmitter } from "node:events";
import type { Redis } from "ioredis";
import { describe, expect, it } from "vitest";
import { waitForRedisReady } from "@/lib/wait-for-redis";

describe("Redis startup recovery", () => {
  it("survives a transient connection error and removes listeners after readiness", async () => {
    const client = Object.assign(new EventEmitter(), { status: "connecting" });
    const waiting = waitForRedisReady(client as unknown as Redis, 100);
    client.emit("error", new Error("connection refused"));
    client.status = "ready";
    client.emit("ready");
    await waiting;
    expect(client.eventNames()).toEqual([]);
  });
  it("rejects a terminal connection and cleans up", async () => {
    const client = Object.assign(new EventEmitter(), { status: "connecting" });
    const waiting = waitForRedisReady(client as unknown as Redis, 100);
    client.emit("end");
    await expect(waiting).rejects.toThrow("closed before becoming ready");
    expect(client.eventNames()).toEqual([]);
  });
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Redis, Cluster } from "ioredis";

/* ioredis owns reconnect attempts until ready/end or timeout. */
const ignoreTransientError = () => {};

export function waitForRedisReady(client: Redis | Cluster, timeoutMs = 30_000): Promise<void> {
  if (client.status === "ready") return Promise.resolve();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      client.off("ready", ready);
      client.off("error", ignoreTransientError);
      client.off("end", ended);
    };
    const ready = () => {
      cleanup();
      resolve();
    };
    const ended = () => {
      cleanup();
      reject(new Error("Redis closed before becoming ready"));
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Redis readiness timed out"));
    }, timeoutMs);
    client.on("ready", ready);
    client.on("error", ignoreTransientError);
    client.on("end", ended);
    if (client.status === "end") ended();
    else if (client.status === "ready") ready();
  });
}

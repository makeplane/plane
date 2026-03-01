/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { Effect, Ref, HashMap } from "effect";
import type { IncomingMessage, ServerResponse } from "http";

interface HealthStatus {
  status: "ok" | "degraded" | "unhealthy";
  timestamp: number;
  uptime: number;
  connections: {
    total: number;
    channels: number;
  };
  redis: {
    connected: boolean;
  };
}

export interface HealthContext<T = unknown, U = unknown> {
  startTime: number;
  clients: Ref.Ref<HashMap.HashMap<string, T>>;
  channelSubscribers: Ref.Ref<HashMap.HashMap<string, U>>;
  redisConnected: () => Effect.Effect<boolean>;
}

export const getHealthStatus = <T, U>(ctx: HealthContext<T, U>): Effect.Effect<HealthStatus> =>
  Effect.gen(function* () {
    const clientMap = yield* Ref.get(ctx.clients);
    const channelMap = yield* Ref.get(ctx.channelSubscribers);
    const redisConnected = yield* ctx.redisConnected().pipe(Effect.catchAll(() => Effect.succeed(false)));

    const totalConnections = HashMap.size(clientMap);
    const totalChannels = HashMap.size(channelMap);
    const uptime = Date.now() - ctx.startTime;

    const status: "ok" | "degraded" | "unhealthy" = redisConnected ? "ok" : "degraded";

    return {
      status,
      timestamp: Date.now(),
      uptime,
      connections: {
        total: totalConnections,
        channels: totalChannels,
      },
      redis: {
        connected: redisConnected,
      },
    };
  });

export const handleHealthRequest = <T, U>(
  ctx: HealthContext<T, U>,
  _req: IncomingMessage,
  res: ServerResponse
): Effect.Effect<void> =>
  Effect.gen(function* () {
    const health = yield* getHealthStatus(ctx);

    res.writeHead(health.status === "ok" ? 200 : 503, { "Content-Type": "application/json" });
    res.end(JSON.stringify(health));
  });

export const handleReadinessRequest = <T, U>(
  ctx: HealthContext<T, U>,
  _req: IncomingMessage,
  res: ServerResponse
): Effect.Effect<void> =>
  Effect.gen(function* () {
    const redisConnected = yield* ctx.redisConnected().pipe(Effect.catchAll(() => Effect.succeed(false)));

    if (redisConnected) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ready: true }));
    } else {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ready: false, reason: "Redis not connected" }));
    }
  });

export const handleLivenessRequest = (_req: IncomingMessage, res: ServerResponse): Effect.Effect<void> =>
  Effect.sync(() => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ alive: true }));
  });

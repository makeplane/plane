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

import { Effect, Redacted } from "effect";
import Redis from "ioredis";
import { Emitter } from "@socket.io/redis-emitter";
import { AppConfig } from "./config";

export class SocketEmitter extends Effect.Service<SocketEmitter>()("SocketEmitter", {
  scoped: Effect.gen(function* () {
    const config = yield* AppConfig;
    const redisUrl = Redacted.value(config.redisUrl);
    const basePath = config.fluxBasePath.endsWith("/") ? config.fluxBasePath.slice(0, -1) : config.fluxBasePath;

    const redisClient = new Redis(redisUrl, {
      lazyConnect: false,
      keepAlive: 30000,
      connectTimeout: 10000,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: true,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
    });

    yield* Effect.addFinalizer(() =>
      Effect.promise(() => redisClient.quit()).pipe(
        Effect.tap(() => Effect.log("Socket emitter Redis client disconnected")),
        Effect.catchAll(() => Effect.void)
      )
    );

    yield* Effect.promise(() => redisClient.ping());
    yield* Effect.log("Socket emitter Redis client connected");

    // Create emitter with the same key prefix as the Socket.IO adapter
    // The adapter uses "socket.io" as the default key prefix
    const emitter = new Emitter(redisClient, {
      key: "socket.io",
    });

    return {
      /**
       * Emit an event to all clients in a workspace room
       * @param workspaceId - The workspace ID
       * @param eventName - The event name to emit
       * @param data - The event data
       */
      emitToWorkspace: (workspaceId: string, eventName: string, data: unknown) =>
        Effect.sync(() => {
          // Emit to the /events/{workspaceId} namespace, workspace:{workspaceId} room
          emitter.of(`/events/${workspaceId}`).to(`workspace:${workspaceId}`).emit(eventName, data);
        }).pipe(
          Effect.tap(() =>
            Effect.logDebug("SOCKET_EMITTER: Emitted event to workspace", {
              workspaceId,
              eventName,
            })
          )
        ),

      /**
       * Emit an event to a specific user across all their connections
       * @param userId - The user ID
       * @param eventName - The event name to emit
       * @param data - The event data
       */
      emitToUser: (workspaceId: string, userId: string, eventName: string, data: unknown) =>
        Effect.sync(() => {
          emitter.of(`/events/${workspaceId}`).to(`user:${userId}`).emit(eventName, data);
        }).pipe(
          Effect.tap(() =>
            Effect.logDebug("SOCKET_EMITTER: Emitted event to user", {
              workspaceId,
              userId,
              eventName,
            })
          )
        ),
    };
  }),
  dependencies: [AppConfig.Default],
}) {}

export const SocketEmitterLive = SocketEmitter.Default;

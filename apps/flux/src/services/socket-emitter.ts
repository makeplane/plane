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

import { Effect } from "effect";
import { Emitter } from "@socket.io/redis-emitter";
import { RedisClient } from "./redis";

export class SocketEmitter extends Effect.Service<SocketEmitter>()("SocketEmitter", {
  effect: Effect.gen(function* () {
    const redisClient = yield* RedisClient;

    // Create emitter with the same key prefix as the Socket.IO adapter
    // The adapter uses "socket.io" as the default key prefix
    const emitter = new Emitter(redisClient, {
      key: "socket.io",
    });

    return {
      /**
       * Emit an event to clients watching a specific entity
       * @param workspaceSlug - The workspace slug (determines namespace)
       * @param room - The room name (e.g. "workitem:{uuid}")
       * @param eventName - The event name to emit
       * @param data - The event data
       */
      emitToEntity: (workspaceSlug: string, room: string, eventName: string, data: unknown) =>
        Effect.sync(() => {
          emitter.of(`/events/${workspaceSlug}`).to(room).emit(eventName, data);
        }).pipe(
          Effect.tap(() =>
            Effect.logDebug("SOCKET_EMITTER: Emitted event to entity", {
              workspaceSlug,
              room,
              eventName,
            })
          )
        ),
    };
  }),
  dependencies: [RedisClient.Default],
}) {}

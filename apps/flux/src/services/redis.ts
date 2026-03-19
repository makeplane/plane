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

import { Context, Effect, Layer, Redacted } from "effect";
import Redis from "ioredis";
import { AppConfig } from "./config";

export class RedisClient extends Context.Tag("RedisClient")<RedisClient, Redis>() {
  static readonly Default = Layer.scoped(
    RedisClient,
    Effect.gen(function* () {
      const config = yield* AppConfig;
      const redisClient = new Redis(Redacted.value(config.redisUrl), {
        lazyConnect: false,
        keepAlive: 30000,
        connectTimeout: 10000,
        maxRetriesPerRequest: 3,
        enableOfflineQueue: true,
        retryStrategy: (times: number) => Math.min(times * 50, 2000),
      });

      yield* Effect.addFinalizer(() =>
        Effect.promise(() => redisClient.quit()).pipe(
          Effect.tap(() => Effect.log("Redis client disconnected")),
          Effect.catchAll(() => Effect.void)
        )
      );

      yield* Effect.promise(() => redisClient.ping());
      yield* Effect.log("Redis client connected");

      return redisClient;
    })
  ).pipe(Layer.provide(AppConfig.Default));
}

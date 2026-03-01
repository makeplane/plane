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

import { Effect, Redacted, PubSub } from "effect";
import Redis from "ioredis";
import { AppConfig } from "./config";

export class RedisClient extends Effect.Service<RedisClient>()("RedisClient", {
  effect: Effect.gen(function* () {
    const config = yield* AppConfig;
    const redisUrl = Redacted.value(config.redisUrl);

    const client = new Redis(redisUrl, {
      lazyConnect: false,
      keepAlive: 30000,
      connectTimeout: 10000,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: true,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
    });

    yield* Effect.addFinalizer(() =>
      Effect.promise(() => client.quit()).pipe(
        Effect.tap(() => Effect.log("Redis client disconnected")),
        Effect.catchAll(() => Effect.void)
      )
    );

    yield* Effect.promise(() => client.ping());
    yield* Effect.log("Redis client connected");

    return {
      client,
      get: (key: string) => Effect.promise(() => client.get(key)),
      set: (key: string, value: string, ttl?: number) =>
        Effect.promise(() => (ttl ? client.setex(key, ttl, value) : client.set(key, value))),
      del: (key: string) => Effect.promise(() => client.del(key)),
      exists: (key: string) => Effect.promise(() => client.exists(key)).pipe(Effect.map((r) => r === 1)),
    };
  }),
  dependencies: [AppConfig.Default],
}) {}

export class RedisPubSub extends Effect.Service<RedisPubSub>()("RedisPubSub", {
  effect: Effect.gen(function* () {
    const config = yield* AppConfig;
    const redisUrl = Redacted.value(config.redisUrl);
    const prefix = config.channelPrefix;

    const publisher = new Redis(redisUrl);
    const subscriber = new Redis(redisUrl);

    const messageHub = yield* PubSub.unbounded<{ channel: string; message: string }>();

    yield* Effect.addFinalizer(() =>
      Effect.all([Effect.promise(() => publisher.quit()), Effect.promise(() => subscriber.quit())]).pipe(
        Effect.tap(() => Effect.log("Redis pub/sub disconnected")),
        Effect.catchAll(() => Effect.void)
      )
    );

    subscriber.on("message", (channel, message) => {
      Effect.runFork(PubSub.publish(messageHub, { channel, message }));
    });

    yield* Effect.log("Redis pub/sub initialized");

    return {
      publish: (channel: string, message: string) =>
        Effect.promise(() => publisher.publish(`${prefix}:${channel}`, message)),

      subscribe: (channel: string) =>
        Effect.promise(() => subscriber.subscribe(`${prefix}:${channel}`)).pipe(
          Effect.tap(() => Effect.log(`Subscribed to channel: ${prefix}:${channel}`))
        ),

      unsubscribe: (channel: string) => Effect.promise(() => subscriber.unsubscribe(`${prefix}:${channel}`)),

      messages: PubSub.subscribe(messageHub),
    };
  }),
  dependencies: [AppConfig.Default],
}) {}

export const RedisClientLive = RedisClient.Default;
export const RedisPubSubLive = RedisPubSub.Default;

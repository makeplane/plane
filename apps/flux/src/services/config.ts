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

import { Config, Effect } from "effect";

export class AppConfig extends Effect.Service<AppConfig>()("AppConfig", {
  effect: Effect.gen(function* () {
    const port = yield* Config.number("PORT").pipe(Config.withDefault(3004));
    const nodeEnv = yield* Config.string("NODE_ENV").pipe(Config.withDefault("development"));
    const redisUrl = yield* Config.redacted("REDIS_URL");
    const channelPrefix = yield* Config.string("CHANNEL_PREFIX").pipe(Config.withDefault("flux"));

    // Flux base path for proxy deployment
    const fluxBasePath = yield* Config.string("FLUX_BASE_PATH").pipe(Config.withDefault("/flux"));

    // API base URL for authentication
    const apiBaseUrl = yield* Config.string("API_BASE_URL").pipe(Config.withDefault("http://api:8000"));

    // CORS origin for socket connections (required for credentials)
    const corsOrigin = yield* Config.string("CORS_ORIGIN").pipe(Config.withDefault("http://localhost:3000"));

    // AMQP configuration
    const amqpUrl = yield* Config.string("AMQP_URL");
    const eventStreamExchange = yield* Config.string("EVENT_STREAM_EXCHANGE").pipe(
      Config.withDefault("plane.event_stream")
    );
    const prefetchCount = yield* Config.number("PREFETCH_COUNT").pipe(Config.withDefault(10));

    return {
      port,
      nodeEnv,
      redisUrl,
      channelPrefix,
      fluxBasePath,
      apiBaseUrl,
      corsOrigin,
      isProduction: nodeEnv === "production",
      // AMQP
      amqpUrl,
      eventStreamExchange,
      prefetchCount,
    };
  }),
}) {}

export const AppConfigLive = AppConfig.Default;

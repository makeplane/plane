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

// dd-trace must be imported before any other modules for proper instrumentation
import "./config/tracer";

import { Effect, Layer, Logger, LogLevel } from "effect";
import { NodeRuntime } from "@effect/platform-node";
import { AppConfigLive, Telemetry, TelemetryTracingLive } from "./services";
import { FluxServer, FluxServerLive } from "./server";

const MainLive = Layer.mergeAll(AppConfigLive, TelemetryTracingLive, FluxServerLive);

const program = Effect.gen(function* () {
  // Initialize telemetry first (Sentry must be ready before other services)
  yield* Telemetry;
  const server = yield* FluxServer;
  yield* server.start;
  yield* Effect.never;
});

const isProduction = process.env.NODE_ENV === "production";

const runnable = program.pipe(
  Effect.provide(MainLive),
  Effect.scoped,
  Logger.withMinimumLogLevel(LogLevel.Info),
  isProduction ? Effect.provide(Logger.replace(Logger.defaultLogger, Logger.jsonLogger)) : (e) => e
);

NodeRuntime.runMain(runnable);

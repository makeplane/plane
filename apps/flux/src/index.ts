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
import { Telemetry, TelemetryLive } from "./services";
import { FluxServer } from "./server";

const MainLive = Layer.mergeAll(TelemetryLive, FluxServer.Default);

const program = Effect.gen(function* () {
  // Initialize telemetry first (Sentry must be ready before other services)
  yield* Telemetry;
  const server = yield* FluxServer;
  yield* server.start;
  yield* Effect.never;
});

const JsonLoggerLive =
  process.env.NODE_ENV === "production" ? Logger.replace(Logger.defaultLogger, Logger.jsonLogger) : Layer.empty;

const runnable = program.pipe(
  Effect.scoped,
  Effect.provide(MainLive),
  Logger.withMinimumLogLevel(LogLevel.Info),
  Effect.provide(JsonLoggerLive)
);

NodeRuntime.runMain(runnable);

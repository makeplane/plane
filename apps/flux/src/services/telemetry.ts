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

import { Effect, Config, Layer, Option, Context } from "effect";
import { AppConfig } from "./config";
import * as Sentry from "@sentry/node";
import { SentrySpanProcessor, SentryPropagator, SentrySampler } from "@sentry/opentelemetry";
import { NodeSdk } from "@effect/opentelemetry";

export interface TelemetryConfig {
  readonly sentryDsn: Option.Option<string>;
  readonly sentryEnvironment: string;
  readonly sentryRelease: string;
  readonly tracesSampleRate: number;
  readonly serviceName: string;
}

const TelemetryConfigSchema = Config.all({
  sentryDsn: Config.option(Config.string("SENTRY_DSN")),
  sentryEnvironment: Config.string("SENTRY_ENVIRONMENT").pipe(Config.withDefault("development")),
  sentryRelease: Config.string("APP_VERSION").pipe(Config.withDefault("v1.0.0")),
  tracesSampleRate: Config.number("SENTRY_TRACES_SAMPLE_RATE").pipe(Config.withDefault(0.5)),
  serviceName: Config.string("SERVICE_NAME").pipe(Config.withDefault("flux")),
});

export interface TelemetryService {
  readonly config: TelemetryConfig;
  readonly captureException: (error: unknown) => Effect.Effect<void>;
  readonly captureMessage: (message: string, level?: Sentry.SeverityLevel) => Effect.Effect<void>;
  readonly setUser: (user: Sentry.User | null) => Effect.Effect<void>;
  readonly setContext: (name: string, context: Record<string, unknown> | null) => Effect.Effect<void>;
}

export class Telemetry extends Context.Tag("Telemetry")<Telemetry, TelemetryService>() {}

/**
 * Complete telemetry layer that provides both the Telemetry service
 * and the Effect OpenTelemetry NodeSdk for automatic span propagation.
 *
 * Initializes Sentry first, then creates the NodeSdk layer with the Sentry client,
 * ensuring proper ordering and no race conditions.
 */
export const TelemetryTracingLive = Layer.unwrapScoped(
  Effect.gen(function* () {
    const config = yield* TelemetryConfigSchema;

    // Initialize Sentry first
    if (Option.isSome(config.sentryDsn)) {
      Sentry.init({
        dsn: config.sentryDsn.value,
        environment: config.sentryEnvironment,
        release: config.sentryRelease,
        tracesSampleRate: config.tracesSampleRate,
        skipOpenTelemetrySetup: true,
        integrations: [Sentry.amqplibIntegration(), Sentry.redisIntegration()],
      });

      yield* Effect.logInfo("Sentry telemetry initialized", {
        environment: config.sentryEnvironment,
        serviceName: config.serviceName,
      });
    } else {
      yield* Effect.logDebug("Sentry telemetry disabled (no SENTRY_DSN configured)");
    }

    // Now Sentry is initialized, we can safely get the client
    const client = Option.isSome(config.sentryDsn) ? Sentry.getClient() : undefined;

    // Cleanup on shutdown
    yield* Effect.addFinalizer(() =>
      Effect.gen(function* () {
        if (Option.isSome(config.sentryDsn)) {
          yield* Effect.promise(() => Sentry.close(2000));
          yield* Effect.logDebug("Sentry closed");
        }
      }).pipe(Effect.catchAll(() => Effect.void))
    );

    // Create the Telemetry service
    const telemetryService: TelemetryService = {
      config,
      captureException: (error: unknown) =>
        Effect.sync(() => {
          if (Option.isSome(config.sentryDsn)) {
            Sentry.captureException(error);
          }
        }),
      captureMessage: (message: string, level: Sentry.SeverityLevel = "info") =>
        Effect.sync(() => {
          if (Option.isSome(config.sentryDsn)) {
            Sentry.captureMessage(message, level);
          }
        }),
      setUser: (user: Sentry.User | null) =>
        Effect.sync(() => {
          if (Option.isSome(config.sentryDsn)) {
            Sentry.setUser(user);
          }
        }),
      setContext: (name: string, context: Record<string, unknown> | null) =>
        Effect.sync(() => {
          if (Option.isSome(config.sentryDsn)) {
            Sentry.setContext(name, context);
          }
        }),
    };

    // Create NodeSdk layer with Sentry integration
    const nodeSdkLayer = NodeSdk.layer(() => ({
      resource: {
        serviceName: config.serviceName,
        serviceVersion: config.sentryRelease,
        attributes: {
          "deployment.environment": config.sentryEnvironment,
        },
      },
      spanProcessor: new SentrySpanProcessor(),
      sampler: client ? new SentrySampler(client) : undefined,
      contextManager: undefined,
      textMapPropagator: new SentryPropagator(),
    }));

    // Combine Telemetry service layer with NodeSdk layer
    return Layer.merge(Layer.succeed(Telemetry, telemetryService), nodeSdkLayer);
  }).pipe(Effect.provide(AppConfig.Default))
);

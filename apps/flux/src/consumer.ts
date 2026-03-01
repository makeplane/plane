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

import { Effect, Layer, Logger, Schema, Fiber } from "effect";
import { NodeRuntime } from "@effect/platform-node";
import { AppConfig, AmqpService, SocketEmitter, Telemetry, TelemetryTracingLive } from "./services";
import { MessageParseError } from "./schema";
import type { AmqpMessage } from "./services/amqp";

export const EventMessage = Schema.Struct({
  event_type: Schema.optional(Schema.String),
  payload: Schema.Struct({
    data: Schema.optional(Schema.Unknown),
    previous_attributes: Schema.optional(Schema.Unknown),
  }),
  timestamp: Schema.optional(Schema.Number),
  publisher: Schema.optional(Schema.String),
  publisher_instance: Schema.optional(Schema.String),
  version: Schema.optional(Schema.String),
  source: Schema.optional(Schema.String),
  outbox_id: Schema.optional(Schema.Number),
  event_id: Schema.optional(Schema.String),
  entity_type: Schema.optional(Schema.String),
  entity_id: Schema.optional(Schema.String),
  workspace_id: Schema.optional(Schema.String),
  project_id: Schema.optional(Schema.String),
  initiator_id: Schema.optional(Schema.String),
  initiator_type: Schema.optional(Schema.String),
});
export type EventMessage = typeof EventMessage.Type;

const parseEventMessage = Effect.fn("parseEventMessage")(
  (content: unknown): Effect.Effect<EventMessage, MessageParseError> =>
    Schema.decodeUnknown(EventMessage)(content).pipe(
      Effect.mapError(
        (error) =>
          new MessageParseError({
            message: `Invalid event message: ${String(error)}`,
            cause: error,
          })
      )
    )
);

const createMessageHandler = (emitter: SocketEmitter) =>
  Effect.fn("processMessage")(
    (message: AmqpMessage): Effect.Effect<void> =>
      Effect.gen(function* () {
        const parseResult = yield* parseEventMessage(message.content).pipe(Effect.either);

        if (parseResult._tag === "Left") {
          yield* Effect.logWarning("CONSUMER: Failed to parse message", { error: parseResult.left });
          yield* message.ack;
          return;
        }

        const event = parseResult.right;

        yield* Effect.logDebug("CONSUMER: Received event", {
          event_type: event.event_type,
          entity_type: event.entity_type,
          workspace_id: event.workspace_id,
        });

        // Emit event to workspace room if workspace_id is present
        if (event.workspace_id) {
          const eventData = {
            entity_id: event.entity_id,
            project_id: event.project_id,
            workspace_id: event.workspace_id,
            event_type: event.event_type,
            entity_type: event.entity_type,
            payload: event.payload,
            timestamp: event.timestamp,
            initiator_id: event.initiator_id,
          };
          yield* emitter.emitToWorkspace(event.workspace_id, "work-item:updated", eventData);
          yield* Effect.logInfo("CONSUMER: Emitted event to workspace", {
            workspace_id: event.workspace_id,
            entity_id: event.entity_id,
            project_id: event.project_id,
          });
        } else {
          yield* Effect.logDebug("CONSUMER: Skipping event without workspace_id", {
            event_type: event.event_type,
          });
        }

        yield* message.ack;
      })
  );

const AmqpLive = AmqpService.Default.pipe(Layer.provide(AppConfig.Default));
const SocketEmitterLive = SocketEmitter.Default.pipe(Layer.provide(AppConfig.Default));
const ConsumerLive = Layer.mergeAll(AppConfig.Default, TelemetryTracingLive, AmqpLive, SocketEmitterLive);

const isProduction = process.env.NODE_ENV === "production";

const main = Effect.gen(function* () {
  // Initialize telemetry first (Sentry must be ready before other services)
  yield* Telemetry;
  const amqp = yield* AmqpService;
  const emitter = yield* SocketEmitter;

  yield* Effect.logInfo("CONSUMER: Starting event consumer...");
  yield* Effect.addFinalizer(() => Effect.logInfo("CONSUMER: Shutting down gracefully..."));

  const processMessage = createMessageHandler(emitter);
  const consumerFiber = yield* amqp.subscribe(processMessage);

  yield* Effect.logInfo("CONSUMER: Listening for events...");
  yield* Fiber.join(consumerFiber);
}).pipe(
  Effect.scoped,
  Effect.provide(ConsumerLive),
  isProduction ? Effect.provide(Logger.replace(Logger.defaultLogger, Logger.jsonLogger)) : (e) => e
);

NodeRuntime.runMain(main);

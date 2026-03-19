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

import { Effect, Layer, Logger, Option, Schema, Stream } from "effect";
import { NodeRuntime } from "@effect/platform-node";
import { AmqpService, SocketEmitter, Telemetry, TelemetryLive, WorkspaceRegistry } from "./services";
import { MessageParseError } from "./schema";
import type { AmqpMessage } from "./services/amqp";

export const EventMessage = Schema.Struct({
  // Required fields — Django outbox guarantees these are NOT NULL
  event_type: Schema.String,
  entity_type: Schema.String,
  entity_id: Schema.String,
  workspace_id: Schema.String,
  timestamp: Schema.Number,
  event_id: Schema.String,
  publisher: Schema.String,
  publisher_instance: Schema.String,
  version: Schema.String,
  source: Schema.String,
  outbox_id: Schema.Number,
  initiator_type: Schema.String,
  payload: Schema.Struct({
    data: Schema.optional(Schema.Unknown),
    previous_attributes: Schema.optional(Schema.Unknown),
  }),
  // Nullable fields — Django model has null=True, blank=True
  project_id: Schema.NullOr(Schema.String),
  initiator_id: Schema.NullOr(Schema.String),
});
export type EventMessage = typeof EventMessage.Type;

const decodeEventMessage = Schema.decodeUnknown(EventMessage);

const parseEventMessage = Effect.fn("parseEventMessage")(function* (content: unknown) {
  return yield* decodeEventMessage(content).pipe(
    Effect.mapError(
      (cause) =>
        new MessageParseError({
          message: `Invalid event message: ${String(cause)}`,
          cause,
        })
    )
  );
});

/** Event type prefixes the web client handles */
const SUPPORTED_ENTITY_PREFIXES = new Set(["workitem", "epic"]);

/** Check whether the event_type targets an entity the client cares about. */
const isSupportedEvent = (eventType: string): boolean => {
  const prefix = eventType.split(".")[0];
  return prefix !== undefined && SUPPORTED_ENTITY_PREFIXES.has(prefix);
};

const createMessageHandler = (emitter: SocketEmitter, registry: WorkspaceRegistry) =>
  Effect.fn("processMessage")(function* (message: AmqpMessage) {
    const parseResult = yield* parseEventMessage(message.content).pipe(Effect.either);

    if (parseResult._tag === "Left") {
      yield* Effect.logWarning("CONSUMER: Failed to parse message", { error: parseResult.left });
      // Parse failures are permanent — ack to discard
      yield* message.ack;
      return;
    }

    const event = parseResult.right;

    yield* Effect.logDebug("CONSUMER: Received event", {
      event_type: event.event_type,
      entity_type: event.entity_type,
      workspace_id: event.workspace_id,
    });

    // Only forward event types the client handles
    if (!isSupportedEvent(event.event_type)) {
      yield* Effect.logDebug("CONSUMER: Skipping unsupported event type", {
        event_type: event.event_type,
        entity_type: event.entity_type,
      });
      yield* message.ack;
      return;
    }

    // Resolve workspace UUID → slug via the registry
    const slugResult = yield* registry.getSlugById(event.workspace_id).pipe(Effect.either);

    if (slugResult._tag === "Left") {
      if (message.redelivered) {
        // Already retried once — ack to avoid infinite loop
        yield* Effect.logError("CONSUMER: Failed to resolve workspace slug on redelivery, dropping", {
          workspace_id: event.workspace_id,
          error: slugResult.left,
        });
        yield* message.ack;
      } else {
        // First failure — nack with requeue for one retry
        yield* Effect.logWarning("CONSUMER: Failed to resolve workspace slug (requeuing)", {
          workspace_id: event.workspace_id,
          error: slugResult.left,
        });
        yield* message.nack;
      }
      return;
    }

    const slugOption = slugResult.right;

    if (Option.isSome(slugOption)) {
      const workspaceSlug = slugOption.value;

      // Build a minimal signal — the client only needs enough info to know what to refetch.
      // For comment events, extract parent_comment_id so the client can invalidate reply threads.
      const eventData: Record<string, unknown> = {
        event_id: event.event_id,
        event_type: event.event_type,
        entity_id: event.entity_id,
      };

      if (event.event_type.includes(".comment.")) {
        const data = event.payload.data;
        if (data != null && typeof data === "object" && "comment" in data) {
          const comment = (data as Record<string, unknown>).comment;
          if (comment != null && typeof comment === "object" && "parent_id" in comment) {
            eventData.parent_comment_id = (comment as Record<string, unknown>).parent_id;
          }
        }
      }

      // Emit to the entity room — only clients subscribed to this entity receive it.
      // Room and event name are both "workitem:{uuid}" or "epic:{uuid}".
      //
      // TODO: Exclude the originating connection from the broadcast to avoid a
      // redundant SWR refetch on the tab that performed the mutation. The
      // industry-standard fix (like Pusher's X-Pusher-Socket-ID) requires:
      //   1. API middleware to read an X-Socket-ID header from the client request
      //   2. Middleware sets a plane.socket_id PostgreSQL session variable
      //   3. Outbox triggers write it into a new column
      //   4. Consumer passes it here so the emitter can call .except(socketId)
      // This needs API-side changes (apps/api/) which are out of scope for now.
      // The current behavior is functionally correct — one extra refetch per
      // mutation for the originating tab.
      const room = `${event.event_type.split(".")[0]}:${event.entity_id}`;
      const emitResult = yield* emitter.emitToEntity(workspaceSlug, room, room, eventData).pipe(Effect.either);

      if (emitResult._tag === "Left") {
        if (message.redelivered) {
          yield* Effect.logError("CONSUMER: Failed to emit event on redelivery, dropping", {
            workspaceSlug,
            error: emitResult.left,
          });
          yield* message.ack;
        } else {
          yield* Effect.logWarning("CONSUMER: Failed to emit event (requeuing)", {
            workspaceSlug,
            error: emitResult.left,
          });
          yield* message.nack;
        }
        return;
      }

      yield* Effect.logInfo("CONSUMER: Emitted event to workspace", {
        workspaceSlug,
        event_type: event.event_type,
        entity_id: event.entity_id,
      });
    } else {
      yield* Effect.logDebug("CONSUMER: No slug mapping for workspace UUID, skipping", {
        workspace_id: event.workspace_id,
        event_type: event.event_type,
      });
    }

    yield* message.ack;
  });

const ConsumerLive = Layer.mergeAll(
  TelemetryLive,
  AmqpService.Default,
  SocketEmitter.Default,
  WorkspaceRegistry.Default
);

const JsonLoggerLive =
  process.env.NODE_ENV === "production" ? Logger.replace(Logger.defaultLogger, Logger.jsonLogger) : Layer.empty;

const main = Effect.gen(function* () {
  // Initialize telemetry first (Sentry must be ready before other services)
  yield* Telemetry;
  const amqp = yield* AmqpService;
  const emitter = yield* SocketEmitter;
  const registry = yield* WorkspaceRegistry;

  yield* Effect.logInfo("CONSUMER: Starting event consumer...");
  yield* Effect.addFinalizer(() => Effect.logInfo("CONSUMER: Shutting down gracefully..."));

  const processMessage = createMessageHandler(emitter, registry);

  yield* Effect.logInfo("CONSUMER: Listening for events...");
  yield* amqp.messages.pipe(Stream.runForEach(processMessage));
}).pipe(Effect.scoped, Effect.provide(ConsumerLive), Effect.provide(JsonLoggerLive));

NodeRuntime.runMain(main);

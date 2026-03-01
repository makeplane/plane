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

import { Effect, Schema, Ref, Queue, Schedule, Duration, Fiber, pipe, Option, Deferred, Runtime, Scope } from "effect";
import amqplib from "amqplib";
import type { Connection, Channel, ConsumeMessage } from "amqplib";
import { AppConfig } from "./config";

export class AmqpConnectionError extends Schema.TaggedError<AmqpConnectionError>()("AmqpConnectionError", {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

export class AmqpConsumeError extends Schema.TaggedError<AmqpConsumeError>()("AmqpConsumeError", {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

export const AmqpMessageContent = Schema.Unknown;

export type AmqpMessage = {
  readonly content: unknown;
  readonly ack: Effect.Effect<void>;
  readonly nack: Effect.Effect<void>;
};

type AmqpConnectionState = {
  readonly connection: Connection | null;
  readonly channel: Channel | null;
  readonly queue: string | null;
  readonly consumerFiber: Fiber.RuntimeFiber<void, never> | null;
  readonly watcherFiber: Fiber.RuntimeFiber<void, never> | null;
  readonly disconnectDeferred: Deferred.Deferred<void, never> | null;
};

const initialState: AmqpConnectionState = {
  connection: null,
  channel: null,
  queue: null,
  consumerFiber: null,
  watcherFiber: null,
  disconnectDeferred: null,
};

type AmqpServiceShape = {
  readonly isConnected: Effect.Effect<boolean>;
  readonly subscribe: <E>(
    handler: (message: AmqpMessage) => Effect.Effect<void, E>
  ) => Effect.Effect<Fiber.RuntimeFiber<void, AmqpConsumeError | E>, AmqpConnectionError, Scope.Scope>;
  readonly messages: Queue.Dequeue<AmqpMessage>;
};

const connect = (url: string, exchange: string, prefetchCount: number) =>
  Effect.gen(function* () {
    yield* Effect.logInfo("AMQP: Connecting...");

    const connection = yield* Effect.tryPromise({
      try: () => amqplib.connect(url, { heartbeat: 30 }),
      catch: (error) =>
        new AmqpConnectionError({
          message: "Failed to connect to AMQP broker",
          cause: error,
        }),
    });

    const channel = yield* Effect.tryPromise({
      try: () => connection.createChannel(),
      catch: (error) =>
        new AmqpConnectionError({
          message: "Failed to create AMQP channel",
          cause: error,
        }),
    });

    yield* Effect.tryPromise({
      try: () => channel.assertExchange(exchange, "fanout", { durable: true }),
      catch: (error) =>
        new AmqpConnectionError({
          message: "Failed to assert exchange",
          cause: error,
        }),
    });

    const { queue } = yield* Effect.tryPromise({
      try: () =>
        channel.assertQueue("", {
          exclusive: true,
          autoDelete: true,
        }),
      catch: (error) =>
        new AmqpConnectionError({
          message: "Failed to create queue",
          cause: error,
        }),
    });

    yield* Effect.tryPromise({
      try: () => channel.bindQueue(queue, exchange, ""),
      catch: (error) =>
        new AmqpConnectionError({
          message: "Failed to bind queue to exchange",
          cause: error,
        }),
    });

    yield* Effect.tryPromise({
      try: () => channel.prefetch(prefetchCount),
      catch: (error) =>
        new AmqpConnectionError({
          message: "Failed to set prefetch count",
          cause: error,
        }),
    });

    yield* Effect.logInfo("AMQP: Connection established");

    return { connection, channel, queue };
  });

const cleanupFibers = (state: AmqpConnectionState) =>
  Effect.gen(function* () {
    if (state.consumerFiber) {
      yield* Effect.logDebug("AMQP: Interrupting consumer fiber");
      yield* Fiber.interrupt(state.consumerFiber).pipe(Effect.ignore);
    }
    if (state.watcherFiber) {
      yield* Effect.logDebug("AMQP: Interrupting watcher fiber");
      yield* Fiber.interrupt(state.watcherFiber).pipe(Effect.ignore);
    }
  });

const disconnect = (state: AmqpConnectionState) =>
  Effect.gen(function* () {
    yield* Effect.logInfo("AMQP: Disconnecting...");

    // First, interrupt any running fibers
    yield* cleanupFibers(state);

    if (state.channel) {
      yield* Effect.tryPromise({
        try: () => state.channel!.close(),
        catch: () => undefined,
      }).pipe(Effect.ignore);
    }

    if (state.connection) {
      yield* Effect.tryPromise({
        try: () => state.connection!.close(),
        catch: () => undefined,
      }).pipe(Effect.ignore);
    }

    yield* Effect.logInfo("AMQP: Disconnected");
  });

const parseMessageContent = (msg: ConsumeMessage): unknown => {
  const content = msg.content.toString();
  const safeParse = Option.liftThrowable(JSON.parse);
  const parseResult = safeParse(content);
  return Option.getOrElse(parseResult, () => content);
};

const createAmqpMessage = (channel: Channel, msg: ConsumeMessage): AmqpMessage => ({
  content: parseMessageContent(msg),
  ack: Effect.sync(() => channel.ack(msg)),
  nack: Effect.sync(() => channel.nack(msg, false, false)),
});

const startConsuming = (
  channel: Channel,
  queueName: string,
  messageQueue: Queue.Queue<AmqpMessage>,
  runtime: Runtime.Runtime<never>
) =>
  Effect.tryPromise({
    try: () =>
      channel.consume(
        queueName,
        (msg) => {
          if (msg) {
            const amqpMessage = createAmqpMessage(channel, msg);
            // Use Runtime.runFork for proper fiber tracking within the runtime
            Runtime.runFork(runtime)(
              Queue.offer(messageQueue, amqpMessage).pipe(
                Effect.catchAllDefect((err) =>
                  Effect.logError("AMQP: Failed to enqueue message", { error: err }).pipe(
                    Effect.tap(() => Effect.sync(() => channel.nack(msg, false, false)))
                  )
                )
              )
            );
          }
        },
        { noAck: false }
      ),
    catch: (error) =>
      new AmqpConsumeError({
        message: "Failed to start consuming",
        cause: error,
      }),
  }).pipe(Effect.asVoid);

const watchConnection = (
  connection: Connection,
  disconnectDeferred: Deferred.Deferred<void, never>,
  runtime: Runtime.Runtime<never>
) =>
  Effect.async<void>((resume) => {
    const handleClose = () => {
      Runtime.runFork(runtime)(
        Effect.logWarning("AMQP: Connection closed").pipe(
          Effect.tap(() => Deferred.succeed(disconnectDeferred, void 0))
        )
      );
      resume(Effect.void);
    };

    const handleError = (error: Error) => {
      Runtime.runFork(runtime)(
        Effect.logError("AMQP: Connection error", { error }).pipe(
          Effect.tap(() => Deferred.succeed(disconnectDeferred, void 0))
        )
      );
      resume(Effect.void);
    };

    connection.on("close", handleClose);
    connection.on("error", handleError);

    return Effect.sync(() => {
      connection.removeListener("close", handleClose);
      connection.removeListener("error", handleError);
    });
  });

const makeAmqpService = Effect.gen(function* () {
  const config = yield* AppConfig;
  const runtime = yield* Effect.runtime<never>();

  const url = config.amqpUrl;
  const exchange = config.eventStreamExchange;
  const prefetchCount = config.prefetchCount;
  const maxRetries = 5;

  const stateRef = yield* Ref.make<AmqpConnectionState>(initialState);
  const messageQueue = yield* Queue.bounded<AmqpMessage>(1000);
  const shutdownRef = yield* Ref.make(false);

  const retrySchedule = pipe(
    Schedule.exponential(Duration.seconds(1)),
    Schedule.compose(Schedule.recurs(maxRetries)),
    Schedule.tapInput((error: AmqpConnectionError) => Effect.logWarning("AMQP: Retrying connection", { error }))
  );

  // Single connection attempt that sets up fibers and returns disconnect signal
  const establishConnection = Effect.gen(function* () {
    // Clean up any existing fibers before reconnecting
    const currentState = yield* Ref.get(stateRef);
    yield* cleanupFibers(currentState);

    // Create a deferred to signal disconnection
    const disconnectDeferred = yield* Deferred.make<void, never>();

    // Connect to AMQP
    const { connection, channel, queue } = yield* connect(url, exchange, prefetchCount);

    // Start consumer fiber (tracked)
    const consumerFiber = yield* Effect.fork(
      startConsuming(channel, queue, messageQueue, runtime).pipe(
        Effect.catchAll((error) => Effect.logError("AMQP: Consumer error", { error }))
      )
    );

    // Start watcher fiber (tracked)
    const watcherFiber = yield* Effect.fork(watchConnection(connection, disconnectDeferred, runtime));

    // Update state with all tracked resources
    yield* Ref.set(stateRef, {
      connection,
      channel,
      queue,
      consumerFiber,
      watcherFiber,
      disconnectDeferred,
    });

    return disconnectDeferred;
  });

  // Connection loop that handles reconnection
  const connectionLoop = Effect.gen(function* () {
    while (true) {
      const isShutdown = yield* Ref.get(shutdownRef);
      if (isShutdown) {
        yield* Effect.logInfo("AMQP: Shutdown requested, exiting connection loop");
        return;
      }

      // Try to establish connection with retry
      const result = yield* establishConnection.pipe(Effect.retry(retrySchedule), Effect.either);

      if (result._tag === "Left") {
        yield* Effect.logError("AMQP: Max reconnect attempts reached, waiting before retry...", {
          maxRetries,
          error: result.left,
        });
        // Wait before trying again after max retries exhausted
        yield* Effect.sleep(Duration.seconds(30));
        continue;
      }

      const disconnectDeferred = result.right;

      // Wait for disconnection signal
      yield* Deferred.await(disconnectDeferred);

      yield* Effect.logInfo("AMQP: Disconnected, will attempt to reconnect...");

      // Clean up current state before reconnecting
      const currentState = yield* Ref.get(stateRef);
      yield* disconnect(currentState);
      yield* Ref.set(stateRef, initialState);

      // Small delay before reconnecting to avoid tight loop
      yield* Effect.sleep(Duration.seconds(1));
    }
  });

  // Start the connection loop in a forked fiber (not daemon - tied to scope)
  const connectionLoopFiber = yield* Effect.forkScoped(connectionLoop);

  // Wait for initial connection to be established
  yield* Effect.gen(function* () {
    while (true) {
      const state = yield* Ref.get(stateRef);
      if (state.connection !== null) {
        return;
      }
      yield* Effect.sleep(Duration.millis(100));
    }
  }).pipe(
    Effect.timeout(Duration.seconds(30)),
    Effect.catchAll(() =>
      Effect.fail(
        new AmqpConnectionError({
          message: "Timed out waiting for initial AMQP connection",
        })
      )
    )
  );

  // Add finalizer for cleanup
  yield* Effect.addFinalizer(() =>
    Effect.gen(function* () {
      yield* Effect.logInfo("AMQP: Service finalizer running...");

      // Signal shutdown
      yield* Ref.set(shutdownRef, true);

      // Interrupt connection loop fiber
      yield* Fiber.interrupt(connectionLoopFiber).pipe(Effect.ignore);

      // Clean up current connection
      const state = yield* Ref.get(stateRef);
      yield* disconnect(state);
      yield* Queue.shutdown(messageQueue);

      yield* Effect.logInfo("AMQP: Service cleanup complete");
    })
  );

  return {
    isConnected: Ref.get(stateRef).pipe(Effect.map((state) => state.connection !== null)),

    subscribe: <E>(handler: (message: AmqpMessage) => Effect.Effect<void, E>) =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        if (!state.connection) {
          return yield* Effect.fail(
            new AmqpConnectionError({
              message: "AMQP not connected",
            })
          );
        }

        // Use forkScoped so fiber is tied to caller's scope
        const fiber = yield* Effect.forkScoped(
          Effect.forever(
            Effect.gen(function* () {
              const message = yield* Queue.take(messageQueue);
              yield* handler(message).pipe(
                Effect.catchAll((error) =>
                  Effect.logError("AMQP: Handler error", { error }).pipe(Effect.flatMap(() => message.nack))
                )
              );
            })
          )
        );

        return fiber;
      }),

    messages: messageQueue,
  } satisfies AmqpServiceShape;
});

export class AmqpService extends Effect.Service<AmqpService>()("AmqpService", {
  scoped: makeAmqpService,
  dependencies: [AppConfig.Default],
}) {}

export const AmqpServiceLive = AmqpService.Default;

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

import { Effect, Fiber, Schema, Ref, Queue, Stream, Schedule, Duration, pipe, Option, Deferred, Runtime } from "effect";
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

export type AmqpMessage = {
  readonly content: unknown;
  readonly redelivered: boolean;
  readonly ack: Effect.Effect<void>;
  readonly nack: Effect.Effect<void>;
};

const parseMessageContent = (msg: ConsumeMessage): unknown => {
  const content = msg.content.toString();
  const safeParse = Option.liftThrowable(JSON.parse);
  const parseResult = safeParse(content);
  return Option.getOrElse(parseResult, () => content);
};

const createAmqpMessage = (channel: Channel, msg: ConsumeMessage): AmqpMessage => ({
  content: parseMessageContent(msg),
  redelivered: msg.fields.redelivered,
  ack: Effect.sync(() => channel.ack(msg)),
  nack: Effect.sync(() => channel.nack(msg, false, true)),
});

const acquireConnection = (url: string) =>
  Effect.acquireRelease(
    Effect.tryPromise({
      try: () => amqplib.connect(url, { heartbeat: 30 }),
      catch: (cause) =>
        new AmqpConnectionError({
          message: "Failed to connect to AMQP broker",
          cause,
        }),
    }),
    (connection) =>
      Effect.tryPromise({
        try: () => connection.close(),
        catch: () => undefined,
      }).pipe(
        Effect.tap(() => Effect.logDebug("AMQP: Connection closed")),
        Effect.ignore
      )
  );

const acquireChannel = (connection: Connection) =>
  Effect.acquireRelease(
    Effect.tryPromise({
      try: () => connection.createChannel(),
      catch: (cause) =>
        new AmqpConnectionError({
          message: "Failed to create AMQP channel",
          cause,
        }),
    }),
    (channel) =>
      Effect.tryPromise({
        try: () => channel.close(),
        catch: () => undefined,
      }).pipe(
        Effect.tap(() => Effect.logDebug("AMQP: Channel closed")),
        Effect.ignore
      )
  );

const setupChannel = Effect.fn("setupChannel")(function* (channel: Channel, exchange: string, prefetchCount: number) {
  yield* Effect.tryPromise({
    try: () => channel.assertExchange(exchange, "fanout", { durable: true }),
    catch: (cause) =>
      new AmqpConnectionError({
        message: "Failed to assert exchange",
        cause,
      }),
  });

  const { queue } = yield* Effect.tryPromise({
    try: () =>
      channel.assertQueue("", {
        exclusive: true,
        autoDelete: true,
      }),
    catch: (cause) =>
      new AmqpConnectionError({
        message: "Failed to create queue",
        cause,
      }),
  });

  yield* Effect.tryPromise({
    try: () => channel.bindQueue(queue, exchange, ""),
    catch: (cause) =>
      new AmqpConnectionError({
        message: "Failed to bind queue to exchange",
        cause,
      }),
  });

  yield* Effect.tryPromise({
    try: () => channel.prefetch(prefetchCount),
    catch: (cause) =>
      new AmqpConnectionError({
        message: "Failed to set prefetch count",
        cause,
      }),
  });

  return queue;
});

const registerConsumer = (
  channel: Channel,
  queueName: string,
  messageQueue: Queue.Queue<AmqpMessage>,
  runtime: Runtime.Runtime<never>
) =>
  Effect.acquireRelease(
    Effect.tryPromise({
      try: () =>
        channel.consume(
          queueName,
          (msg) => {
            if (msg) {
              const amqpMessage = createAmqpMessage(channel, msg);
              Runtime.runFork(runtime)(
                Queue.offer(messageQueue, amqpMessage).pipe(
                  Effect.catchAllCause((cause) =>
                    Effect.logError("AMQP: Failed to enqueue message", { cause }).pipe(
                      Effect.tap(() => Effect.sync(() => channel.nack(msg, false, true)).pipe(Effect.ignore))
                    )
                  )
                )
              );
            }
          },
          { noAck: false }
        ),
      catch: (cause) =>
        new AmqpConsumeError({
          message: "Failed to start consuming",
          cause,
        }),
    }),
    ({ consumerTag }) =>
      Effect.tryPromise({
        try: () => channel.cancel(consumerTag),
        catch: () => undefined,
      }).pipe(Effect.ignore)
  ).pipe(Effect.asVoid);

const waitForDisconnect = (connection: Connection, channel: Channel, runtime: Runtime.Runtime<never>) =>
  Effect.async<void>((resume) => {
    let done = false;

    const finish = (logEffect: Effect.Effect<void>) => {
      if (done) return;
      done = true;
      Runtime.runFork(runtime)(logEffect);
      resume(Effect.void);
    };

    const onClose = () => finish(Effect.logWarning("AMQP: Connection/channel closed"));

    const onError = (error: unknown) => finish(Effect.logError("AMQP: Connection/channel error", { error }));

    connection.once("close", onClose);
    connection.once("error", onError as Parameters<Connection["once"]>[1]);
    channel.once("close", onClose);
    channel.once("error", onError as Parameters<Channel["once"]>[1]);

    return Effect.sync(() => {
      connection.removeListener("close", onClose);
      connection.removeListener("error", onError);
      channel.removeListener("close", onClose);
      channel.removeListener("error", onError);
    });
  });

const makeAmqpService = Effect.gen(function* () {
  const config = yield* AppConfig;
  const runtime = yield* Effect.runtime<never>();

  const url = config.amqpUrl;
  const exchange = config.eventStreamExchange;
  const prefetchCount = config.prefetchCount;
  const maxRetries = 5;

  const connectedRef = yield* Ref.make(false);
  const messageQueue = yield* Queue.bounded<AmqpMessage>(1000);
  const firstConnected = yield* Deferred.make<void, never>();

  const retrySchedule = pipe(
    Schedule.exponential(Duration.seconds(1)),
    Schedule.compose(Schedule.recurs(maxRetries)),
    Schedule.tapInput((error: AmqpConnectionError | AmqpConsumeError) =>
      Effect.logWarning("AMQP: Retrying connection", { error })
    )
  );

  // One connection session: acquire resources, consume, wait for disconnect.
  // Disconnect listeners are installed immediately after acquiring connection/channel
  // to avoid a race where a broker-initiated close fires before waitForDisconnect attaches.
  const runSession = Effect.scoped(
    Effect.gen(function* () {
      const connection = yield* acquireConnection(url);
      const channel = yield* acquireChannel(connection);

      // Install disconnect listeners early — before setup/consume so we never miss a close event
      const disconnectFiber = yield* Effect.fork(waitForDisconnect(connection, channel, runtime));

      const queue = yield* setupChannel(channel, exchange, prefetchCount);
      yield* registerConsumer(channel, queue, messageQueue, runtime);

      yield* Ref.set(connectedRef, true);
      yield* Deferred.succeed(firstConnected, void 0).pipe(Effect.ignore);

      yield* Effect.logInfo("AMQP: Connection established, consuming messages");
      yield* Fiber.join(disconnectFiber);
    }).pipe(Effect.ensuring(Ref.set(connectedRef, false)))
  );

  // Reconnect cycle: try session with retries, on failure wait before retry
  const reconnectCycle = runSession.pipe(
    Effect.retry(retrySchedule),
    Effect.catchAll((error) =>
      Effect.logError("AMQP: Max reconnect attempts reached, waiting before retry...", {
        maxRetries,
        error,
      }).pipe(Effect.tap(() => Effect.sleep(Duration.seconds(30))))
    ),
    Effect.tap(() => Effect.logInfo("AMQP: Disconnected, will attempt to reconnect...")),
    Effect.tap(() => Effect.sleep(Duration.seconds(1)))
  );

  // Start the connection loop in a forked fiber (tied to scope)
  yield* Effect.forkScoped(Effect.forever(reconnectCycle));

  // Wait for initial connection to be established
  yield* Deferred.await(firstConnected).pipe(
    Effect.timeout(Duration.seconds(30)),
    Effect.catchAll(() =>
      Effect.fail(
        new AmqpConnectionError({
          message: "Timed out waiting for initial AMQP connection",
        })
      )
    )
  );

  // Finalizer only needs to shut down the queue — scoped sessions handle connection cleanup
  yield* Effect.addFinalizer(() =>
    Effect.gen(function* () {
      yield* Effect.logInfo("AMQP: Service finalizer running...");
      yield* Queue.shutdown(messageQueue);
      yield* Effect.logInfo("AMQP: Service cleanup complete");
    })
  );

  return {
    isConnected: Ref.get(connectedRef),
    messages: Stream.fromQueue(messageQueue),
  };
});

export class AmqpService extends Effect.Service<AmqpService>()("AmqpService", {
  scoped: makeAmqpService,
  dependencies: [AppConfig.Default],
}) {}

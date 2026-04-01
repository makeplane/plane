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

import { Effect, Duration, Schedule, pipe } from "effect";
import { ExportTimeoutError } from "@/schema/export";

export const withTimeoutAndRetry =
  (operation: string, { timeoutMs = 5000, maxRetries = 2 }: { timeoutMs?: number; maxRetries?: number } = {}) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E | ExportTimeoutError, R> =>
    effect.pipe(
      Effect.timeoutFail({
        duration: Duration.millis(timeoutMs),
        onTimeout: () =>
          new ExportTimeoutError({
            message: `Operation "${operation}" timed out after ${timeoutMs}ms`,
            operation,
          }),
      }),
      Effect.retry(
        pipe(
          Schedule.exponential(Duration.millis(200)),
          Schedule.intersect(Schedule.recurs(maxRetries)),
          Schedule.jittered,
          Schedule.whileInput((error: E | ExportTimeoutError) => !(error instanceof ExportTimeoutError)),
          Schedule.tapInput((error: E | ExportTimeoutError) => {
            const errorInfo =
              error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error;
            return Effect.logWarning("EXPORT: Retrying operation", { operation, error: errorInfo });
          })
        )
      )
    );

export const recoverWithDefault =
  <A>(fallback: A) =>
  <E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, never, R> =>
    effect.pipe(
      Effect.tapError((error) => Effect.logWarning("EXPORT: Operation failed, using fallback", { error })),
      Effect.catchAll(() => Effect.succeed(fallback))
    );

export const tryAsync = <A, E>(fn: () => Promise<A>, onError: (cause: unknown) => E): Effect.Effect<A, E> =>
  Effect.tryPromise({
    try: fn,
    catch: onError,
  });

export const abortableFetch = (url: string, init?: RequestInit): Effect.Effect<Response, unknown> => {
  const controller = new AbortController();
  return Effect.tryPromise({
    try: () => fetch(url, { ...init, signal: controller.signal }),
    catch: (cause) => cause,
  }).pipe(Effect.onInterrupt(() => Effect.sync(() => controller.abort())));
};

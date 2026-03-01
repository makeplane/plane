/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Effect utility functions for PDF export operations with proper typing
 */

import { Effect, Duration, Schedule, pipe } from "effect";
import { PdfTimeoutError } from "@/schema/pdf-export";

/**
 * Wraps an effect with timeout and exponential backoff retry logic.
 * Preserves the environment type R for proper dependency injection.
 */
export const withTimeoutAndRetry =
  (operation: string, { timeoutMs = 5000, maxRetries = 2 }: { timeoutMs?: number; maxRetries?: number } = {}) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E | PdfTimeoutError, R> =>
    effect.pipe(
      Effect.timeoutFail({
        duration: Duration.millis(timeoutMs),
        onTimeout: () =>
          new PdfTimeoutError({
            message: `Operation "${operation}" timed out after ${timeoutMs}ms`,
            operation,
          }),
      }),
      Effect.retry(
        pipe(
          Schedule.exponential(Duration.millis(200)),
          Schedule.compose(Schedule.recurs(maxRetries)),
          Schedule.tapInput((error: E | PdfTimeoutError) => {
            // Serialize error properly for logging
            const errorInfo =
              error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error;
            return Effect.logWarning("PDF_EXPORT: Retrying operation", { operation, error: errorInfo });
          })
        )
      )
    );

/**
 * Recovers from any error with a default fallback value.
 * Logs the error before recovering.
 */
export const recoverWithDefault =
  <A>(fallback: A) =>
  <E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, never, R> =>
    effect.pipe(
      Effect.tapError((error) => Effect.logWarning("PDF_EXPORT: Operation failed, using fallback", { error })),
      Effect.catchAll(() => Effect.succeed(fallback))
    );

/**
 * Wraps a promise-returning function with proper Effect error handling
 */
export const tryAsync = <A, E>(fn: () => Promise<A>, onError: (cause: unknown) => E): Effect.Effect<A, E> =>
  Effect.tryPromise({
    try: fn,
    catch: onError,
  });

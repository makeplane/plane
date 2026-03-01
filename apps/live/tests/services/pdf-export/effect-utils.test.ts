/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Tests for Effect utility functions
 */

import { describe, it, expect, assert } from "vitest";
import { Effect, Duration, Either } from "effect";
import { withTimeoutAndRetry, recoverWithDefault, tryAsync } from "@/services/pdf-export/effect-utils";
import { PdfTimeoutError } from "@/schema/pdf-export";

describe("effect-utils", () => {
  describe("withTimeoutAndRetry", () => {
    it("should succeed when effect completes within timeout", async () => {
      const effect = Effect.succeed("success");
      const wrapped = withTimeoutAndRetry("test-operation")(effect);

      const result = await Effect.runPromise(wrapped);
      expect(result).toBe("success");
    });

    it("should fail with PdfTimeoutError when effect exceeds timeout", async () => {
      const slowEffect = Effect.gen(function* () {
        yield* Effect.sleep(Duration.millis(500));
        return "success";
      });

      const wrapped = withTimeoutAndRetry("test-operation", {
        timeoutMs: 50,
        maxRetries: 0,
      })(slowEffect);

      const result = await Effect.runPromise(Effect.either(wrapped));

      assert(Either.isLeft(result), "Expected Left but got Right");
      expect(result.left).toBeInstanceOf(PdfTimeoutError);
      expect(result.left.operation).toBe("test-operation");
    });

    it("should retry on failure up to maxRetries times", async () => {
      const attemptCounter = { count: 0 };

      const flakyEffect = Effect.gen(function* () {
        attemptCounter.count++;
        if (attemptCounter.count < 3) {
          return yield* Effect.fail(new Error("transient failure"));
        }
        return "success";
      });

      const wrapped = withTimeoutAndRetry("test-operation", {
        timeoutMs: 5000,
        maxRetries: 3,
      })(flakyEffect);

      const result = await Effect.runPromise(wrapped);

      expect(result).toBe("success");
      expect(attemptCounter.count).toBe(3);
    });

    it("should fail after exhausting retries", async () => {
      const effect = Effect.fail(new Error("permanent failure"));

      const wrapped = withTimeoutAndRetry("test-operation", {
        timeoutMs: 5000,
        maxRetries: 2,
      })(effect);

      const result = await Effect.runPromise(Effect.either(wrapped));

      expect(result._tag).toBe("Left");
    });
  });

  describe("recoverWithDefault", () => {
    it("should return success value when effect succeeds", async () => {
      const effect = Effect.succeed("success");
      const wrapped = recoverWithDefault("fallback")(effect);

      const result = await Effect.runPromise(wrapped);
      expect(result).toBe("success");
    });

    it("should return fallback value when effect fails", async () => {
      const effect = Effect.fail(new Error("failure"));
      const wrapped = recoverWithDefault("fallback")(effect);

      const result = await Effect.runPromise(wrapped);
      expect(result).toBe("fallback");
    });

    it("should log warning when recovering from error", async () => {
      const logs: string[] = [];

      const effect = Effect.fail(new Error("test error")).pipe(
        recoverWithDefault("fallback"),
        Effect.tap(() => Effect.sync(() => logs.push("after recovery")))
      );

      const result = await Effect.runPromise(effect);

      expect(result).toBe("fallback");
      expect(logs).toContain("after recovery");
    });

    it("should work with complex fallback objects", async () => {
      const fallback = { items: [], count: 0, metadata: { version: 1 } };

      const effect = Effect.fail(new Error("failure"));
      const wrapped = recoverWithDefault(fallback)(effect);

      const result = await Effect.runPromise(wrapped);
      expect(result).toEqual(fallback);
    });
  });

  describe("tryAsync", () => {
    it("should wrap successful promise", async () => {
      const effect = tryAsync(
        () => Promise.resolve("success"),
        (err) => new Error(`wrapped: ${String(err)}`)
      );

      const result = await Effect.runPromise(effect);
      expect(result).toBe("success");
    });

    it("should wrap rejected promise with custom error", async () => {
      const effect = tryAsync(
        () => Promise.reject(new Error("original")),
        (err) => new Error(`wrapped: ${(err as Error).message}`)
      );

      const result = await Effect.runPromise(Effect.either(effect));

      assert(Either.isLeft(result), "Expected Left but got Right");
      expect(result.left.message).toBe("wrapped: original");
    });

    it("should handle synchronous throws", async () => {
      const effect = tryAsync(
        () => {
          throw new Error("sync error");
        },
        (err) => new Error(`caught: ${(err as Error).message}`)
      );

      const result = await Effect.runPromise(Effect.either(effect));

      assert(Either.isLeft(result), "Expected Left but got Right");
      expect(result.left.message).toBe("caught: sync error");
    });
  });
});

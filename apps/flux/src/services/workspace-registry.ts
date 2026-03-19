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

import { Effect, Option } from "effect";
import { RedisClient } from "./redis";

const KEY_PREFIX_ID_TO_SLUG = "flux:ws:id-to-slug:";
const KEY_PREFIX_SLUG_TO_ID = "flux:ws:slug-to-id:";
const TTL_SECONDS = 86400; // 24 hours

export class WorkspaceRegistry extends Effect.Service<WorkspaceRegistry>()("WorkspaceRegistry", {
  effect: Effect.gen(function* () {
    const redisClient = yield* RedisClient;

    const register = Effect.fn("WorkspaceRegistry.register")(function* (workspaceId: string, workspaceSlug: string) {
      yield* Effect.tryPromise({
        try: () =>
          redisClient
            .multi()
            .set(`${KEY_PREFIX_ID_TO_SLUG}${workspaceId}`, workspaceSlug, "EX", TTL_SECONDS)
            .set(`${KEY_PREFIX_SLUG_TO_ID}${workspaceSlug}`, workspaceId, "EX", TTL_SECONDS)
            .exec(),
        catch: (error) => new Error(`Failed to register workspace mapping: ${String(error)}`),
      });
    });

    const refreshTtl = Effect.fn("WorkspaceRegistry.refreshTtl")(function* (
      workspaceId: string,
      workspaceSlug: string
    ) {
      yield* Effect.tryPromise({
        try: () =>
          redisClient
            .multi()
            .expire(`${KEY_PREFIX_ID_TO_SLUG}${workspaceId}`, TTL_SECONDS)
            .expire(`${KEY_PREFIX_SLUG_TO_ID}${workspaceSlug}`, TTL_SECONDS)
            .exec(),
        catch: () => undefined,
      }).pipe(Effect.ignore);
    });

    const getSlugById = Effect.fn("WorkspaceRegistry.getSlugById")(function* (workspaceId: string) {
      const idKey = `${KEY_PREFIX_ID_TO_SLUG}${workspaceId}`;
      const result = yield* Effect.tryPromise({
        try: () => redisClient.get(idKey),
        catch: (error) => new Error(`Failed to get slug by id: ${String(error)}`),
      });
      // Sliding TTL: refresh expiry on successful read to keep mappings alive while actively used
      if (result !== null) {
        yield* Effect.tryPromise({
          try: () => redisClient.expire(idKey, TTL_SECONDS),
          catch: () => undefined,
        });
      }
      return Option.fromNullable(result);
    });

    const getIdBySlug = Effect.fn("WorkspaceRegistry.getIdBySlug")(function* (workspaceSlug: string) {
      const slugKey = `${KEY_PREFIX_SLUG_TO_ID}${workspaceSlug}`;
      const result = yield* Effect.tryPromise({
        try: () => redisClient.get(slugKey),
        catch: (error) => new Error(`Failed to get id by slug: ${String(error)}`),
      });
      // Sliding TTL: refresh expiry on successful read to keep mappings alive while actively used
      if (result !== null) {
        yield* Effect.tryPromise({
          try: () => redisClient.expire(slugKey, TTL_SECONDS),
          catch: () => undefined,
        });
      }
      return Option.fromNullable(result);
    });

    return { register, refreshTtl, getSlugById, getIdBySlug };
  }),
  dependencies: [RedisClient.Default],
}) {}

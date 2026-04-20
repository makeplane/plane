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

import { Effect, Schema } from "effect";
import { FetchHttpClient, HttpClient, HttpClientError, HttpClientResponse, Headers } from "@effect/platform";
import { AppConfig } from "./config";

export const User = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  display_name: Schema.String,
});
export type User = typeof User.Type;

export const Workspace = Schema.Struct({
  id: Schema.String,
  slug: Schema.String,
});
export type Workspace = typeof Workspace.Type;

export const WorkspacePermissions = Schema.Struct({
  relation: Schema.NullOr(Schema.String),
  permission_grants: Schema.Array(Schema.String),
});
export type WorkspacePermissions = typeof WorkspacePermissions.Type;

export class AuthServiceError extends Schema.TaggedError<AuthServiceError>()("AuthServiceError", {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

export class AuthService extends Effect.Service<AuthService>()("AuthService", {
  effect: Effect.gen(function* () {
    const { apiBaseUrl } = yield* AppConfig;
    const client = HttpClient.filterStatusOk(yield* HttpClient.HttpClient);

    const currentUser = Effect.fn("AuthService.currentUser")(function* (cookie: string) {
      const url = new URL("/api/users/me/", apiBaseUrl).toString();
      return yield* client.get(url, { headers: Headers.fromInput({ Cookie: cookie }) }).pipe(
        Effect.flatMap(HttpClientResponse.schemaBodyJson(User)),
        Effect.mapError(
          (cause) =>
            new AuthServiceError({
              message: "Failed to fetch current user",
              cause,
            })
        )
      );
    });

    const getWorkspace = Effect.fn("AuthService.getWorkspace")(function* (cookie: string, workspaceSlug: string) {
      const url = new URL(`/api/workspaces/${workspaceSlug}/`, apiBaseUrl).toString();
      return yield* client.get(url, { headers: Headers.fromInput({ Cookie: cookie }) }).pipe(
        Effect.flatMap(HttpClientResponse.schemaBodyJson(Workspace)),
        Effect.mapError(
          (cause) =>
            new AuthServiceError({
              message: "Failed to fetch workspace",
              cause,
            })
        )
      );
    });

    const getWorkspacePermissions = Effect.fn("AuthService.getWorkspacePermissions")(function* (
      cookie: string,
      workspaceSlug: string
    ) {
      const url = new URL(`/api/workspaces/${workspaceSlug}/permissions/`, apiBaseUrl).toString();
      return yield* client.get(url, { headers: Headers.fromInput({ Cookie: cookie }) }).pipe(
        Effect.flatMap(HttpClientResponse.schemaBodyJson(WorkspacePermissions)),
        Effect.catchIf(
          (e): e is HttpClientError.ResponseError =>
            e instanceof HttpClientError.ResponseError &&
            e.reason === "StatusCode" &&
            (e.response.status === 403 || e.response.status === 404),
          () => Effect.succeed(null)
        ),
        Effect.mapError(
          (cause) =>
            new AuthServiceError({
              message: "Failed to fetch workspace permissions",
              cause,
            })
        )
      );
    });

    return { currentUser, getWorkspace, getWorkspacePermissions };
  }),
  dependencies: [AppConfig.Default, FetchHttpClient.layer],
}) {}

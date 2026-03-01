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

import { Effect, Context } from "effect";
import axios from "axios";

export interface IUser {
  id: string;
  email: string;
  display_name: string;
}

export interface WorkspaceMembership {
  role: number;
}

export class AuthServiceError {
  readonly _tag = "AuthServiceError";
  constructor(
    readonly message: string,
    readonly cause?: unknown
  ) {}
}

export interface AuthServiceConfig {
  apiBaseUrl: string;
}

export class AuthService extends Context.Tag("AuthService")<
  AuthService,
  {
    readonly currentUser: (cookie: string) => Effect.Effect<IUser, AuthServiceError>;
    readonly getWorkspaceMembership: (
      cookie: string,
      workspaceId: string
    ) => Effect.Effect<WorkspaceMembership | null, AuthServiceError>;
  }
>() {}

export const makeAuthService = (config: AuthServiceConfig) => {
  const client = axios.create({
    baseURL: config.apiBaseUrl,
    withCredentials: true,
    timeout: 20000,
  });

  const currentUser = (cookie: string): Effect.Effect<IUser, AuthServiceError> =>
    Effect.tryPromise({
      try: async () => {
        const response = await client.get<IUser>("/api/users/me/", {
          headers: { Cookie: cookie },
        });
        return response.data;
      },
      catch: (error) => new AuthServiceError("Failed to fetch current user", error),
    });

  const getWorkspaceMembership = (
    cookie: string,
    workspaceId: string
  ): Effect.Effect<WorkspaceMembership | null, AuthServiceError> =>
    Effect.tryPromise({
      try: async () => {
        const response = await client.get<WorkspaceMembership>(`/api/workspaces/${workspaceId}/workspace-members/me/`, {
          headers: { Cookie: cookie },
        });
        return response.data;
      },
      catch: () => null as WorkspaceMembership | null,
    }).pipe(Effect.catchAll(() => Effect.succeed(null)));

  return { currentUser, getWorkspaceMembership };
};

export const AuthServiceLive = (config: AuthServiceConfig) => AuthService.of(makeAuthService(config));

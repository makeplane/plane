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

import { Effect } from "effect";
import type { Socket } from "socket.io";
import type { AuthService, User } from "../services/auth";
import type { WorkspaceRegistry } from "../services/workspace-registry";

export interface AuthenticatedSocket extends Socket {
  data: {
    user: User;
    workspaceSlug?: string;
    workspaceId?: string;
  };
}

export interface AuthMiddlewareConfig {
  auth: AuthService;
  registry: WorkspaceRegistry;
  runPromise: <A, E>(effect: Effect.Effect<A, E, never>) => Promise<A>;
  runFork: <A, E>(effect: Effect.Effect<A, E, never>) => void;
  requireWorkspacePermissions?: boolean;
}

const getCookie = (socket: Socket): string | undefined => {
  const auth: unknown = socket.handshake.auth;
  const authCookie =
    typeof auth === "object" &&
    auth !== null &&
    "cookie" in auth &&
    typeof (auth as Record<string, unknown>).cookie === "string"
      ? ((auth as Record<string, unknown>).cookie as string)
      : undefined;

  const headerCookie =
    typeof socket.handshake.headers.cookie === "string" ? socket.handshake.headers.cookie : undefined;

  return authCookie ?? headerCookie;
};

/**
 * Creates a Socket.IO authentication middleware
 * Validates user session via cookie and optionally checks workspace permissions
 */
export const createAuthMiddleware = (config: AuthMiddlewareConfig) => {
  const { auth, registry, runPromise, runFork } = config;

  return async (socket: Socket, next: (err?: Error) => void) => {
    const authEffect = Effect.gen(function* () {
      const cookie = getCookie(socket);

      if (!cookie) {
        return yield* Effect.fail(new Error("Authentication required: No session cookie provided"));
      }

      const userResult = yield* auth
        .currentUser(cookie)
        .pipe(Effect.mapError(() => new Error("Authentication failed: Invalid or expired session")));

      if (!userResult || !userResult.id) {
        return yield* Effect.fail(new Error("Authentication failed: User not found"));
      }

      // Extract workspaceSlug from namespace path (e.g., /events/my-workspace)
      const namespacePath = socket.nsp.name;
      const workspaceMatch = namespacePath.match(/^\/events\/(.+)$/);
      const workspaceSlug = workspaceMatch?.[1];

      // Optionally verify workspace permissions
      if (config.requireWorkspacePermissions && workspaceSlug) {
        const permissions = yield* auth
          .getWorkspacePermissions(cookie, workspaceSlug)
          .pipe(Effect.mapError(() => new Error("Authentication failed: Could not verify workspace permissions")));
        if (!permissions) {
          return yield* Effect.fail(
            new Error(`Access denied: User does not have permissions to access workspace ${workspaceSlug}`)
          );
        }
      }

      // Fetch workspace UUID and register the slug↔UUID mapping
      let workspaceId: string | undefined;
      if (workspaceSlug) {
        const workspace = yield* auth
          .getWorkspace(cookie, workspaceSlug)
          .pipe(Effect.mapError(() => new Error("Authentication failed: Could not fetch workspace")));
        workspaceId = workspace.id;
        yield* registry.register(workspaceId, workspaceSlug);
      }

      // Attach user info to socket
      (socket as AuthenticatedSocket).data.user = userResult;
      (socket as AuthenticatedSocket).data.workspaceSlug = workspaceSlug;
      (socket as AuthenticatedSocket).data.workspaceId = workspaceId;

      yield* Effect.logInfo("User authenticated for socket connection", {
        userId: userResult.id,
        email: userResult.email,
        workspaceSlug,
        workspaceId,
        socketId: socket.id,
      });

      return userResult;
    });

    try {
      await runPromise(authEffect);
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      runFork(
        Effect.logWarning("Socket authentication failed", {
          error: message,
          socketId: socket.id,
          remoteAddress: socket.handshake.address,
        })
      );
      next(new Error(message));
    }
  };
};

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
import { makeAuthService } from "../services/auth";
import type { IUser } from "../services/auth";

export interface AuthenticatedSocket extends Socket {
  data: {
    user: IUser;
    workspaceId?: string;
  };
}

export interface AuthMiddlewareConfig {
  apiBaseUrl: string;
  requireWorkspaceMembership?: boolean;
}

/**
 * Creates a Socket.IO authentication middleware
 * Validates user session via cookie and optionally checks workspace membership
 */
export const createAuthMiddleware = (config: AuthMiddlewareConfig) => {
  const authService = makeAuthService({ apiBaseUrl: config.apiBaseUrl });

  return async (socket: Socket, next: (err?: Error) => void) => {
    const authEffect = Effect.gen(function* () {
      // Extract cookie from handshake
      const cookie = socket.handshake.auth?.cookie || socket.handshake.headers?.cookie;

      if (!cookie) {
        return yield* Effect.fail(new Error("Authentication required: No session cookie provided"));
      }

      // Validate user session with the API
      const userResult = yield* authService
        .currentUser(cookie)
        .pipe(Effect.mapError(() => new Error("Authentication failed: Invalid or expired session")));

      if (!userResult || !userResult.id) {
        return yield* Effect.fail(new Error("Authentication failed: User not found"));
      }

      // Extract workspaceId from namespace path (e.g., /events/workspace-123)
      const namespacePath = socket.nsp.name;
      const workspaceMatch = namespacePath.match(/^\/events\/(.+)$/);
      const workspaceId = workspaceMatch?.[1];

      // Optionally verify workspace membership
      if (config.requireWorkspaceMembership && workspaceId) {
        const membership = yield* authService.getWorkspaceMembership(cookie, workspaceId);
        if (!membership) {
          return yield* Effect.fail(new Error(`Access denied: User is not a member of workspace ${workspaceId}`));
        }
      }

      // Attach user info to socket
      socket.data.user = userResult;
      socket.data.workspaceId = workspaceId;

      yield* Effect.logInfo("User authenticated for socket connection", {
        userId: userResult.id,
        email: userResult.email,
        workspaceId,
        socketId: socket.id,
      });

      return userResult;
    });

    const result = await Effect.runPromiseExit(authEffect);

    if (result._tag === "Success") {
      next();
    } else {
      const error = result.cause;
      let message = "Authentication failed";

      // Extract error message from the cause
      if ("_tag" in error && error._tag === "Fail") {
        const failError = error as { error: Error };
        message = failError.error?.message || message;
      }

      Effect.runSync(
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

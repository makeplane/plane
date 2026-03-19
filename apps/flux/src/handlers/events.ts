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

import { Effect, Ref, HashMap } from "effect";
import type { Namespace, Socket } from "socket.io";
import type { AuthenticatedSocket } from "../middleware";
import type { WorkspaceRegistry } from "../services/workspace-registry";

// Types
export type WorkspaceSlug = string;
export type ClientId = string;

export interface WorkspaceConnection {
  clientId: ClientId;
  workspaceSlug: WorkspaceSlug;
  workspaceId?: string;
  userId: string;
  userEmail?: string;
  connectedAt: number;
}

export interface EventsHandlerContext {
  workspaceConnections: Ref.Ref<HashMap.HashMap<ClientId, WorkspaceConnection>>;
  registry: WorkspaceRegistry;
  runFork: <A, E>(effect: Effect.Effect<A, E, never>) => void;
}

// Entity types the consumer emits events for — reject unknown types to prevent room spam
const ALLOWED_ENTITY_TYPES = new Set(["workitem", "epic"]);

// Refresh interval: 6 hours (well within the 24h TTL)
const REGISTRY_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

/**
 * Setup handler for the /events/{workspaceSlug} namespace.
 * Clients connect to a workspace-specific namespace and can subscribe to allowed entity rooms within it.
 * Note: Authentication is handled by middleware before this handler is called.
 */
export const setupEventsNamespace = (namespace: Namespace, ctx: EventsHandlerContext): void => {
  namespace.on("connection", (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const namespacePath = socket.nsp.name;
    const workspaceSlug = namespacePath.replace("/events/", "");
    const clientId = socket.id;

    // Get authenticated user from socket data (set by auth middleware)
    const user = authSocket.data.user;
    const workspaceId = authSocket.data.workspaceId;
    if (!user) {
      // This shouldn't happen as auth middleware should reject unauthenticated connections
      socket.disconnect(true);
      return;
    }

    // Periodically refresh the workspace registry TTL while this client is connected
    let refreshTimer: ReturnType<typeof setInterval> | undefined;
    if (workspaceId) {
      refreshTimer = setInterval(() => {
        ctx.runFork(
          ctx.registry.register(workspaceId, workspaceSlug).pipe(
            Effect.tap(() =>
              Effect.logDebug("EVENTS: Refreshed workspace registry mapping", {
                workspaceSlug,
                workspaceId,
              })
            ),
            Effect.catchAll(() => Effect.void)
          )
        );
      }, REGISTRY_REFRESH_INTERVAL_MS);
    }

    ctx.runFork(
      Effect.gen(function* () {
        // Track connection with user info
        const connection: WorkspaceConnection = {
          clientId,
          workspaceSlug,
          workspaceId,
          userId: user.id,
          userEmail: user.email,
          connectedAt: Date.now(),
        };
        yield* Ref.update(ctx.workspaceConnections, (map) => HashMap.set(map, clientId, connection));

        yield* Effect.logInfo("EVENTS: Authenticated client connected to workspace", {
          clientId,
          workspaceSlug,
          userId: user.id,
          userEmail: user.email,
          namespace: namespacePath,
          connectedClients: namespace.sockets.size,
          remoteAddress: socket.handshake.address,
        });
      })
    );

    // Handle entity subscriptions — client watches/unwatches specific entities
    // Only allow entity types the consumer actually emits events for
    socket.on("subscribe:entity", (data: { entityType: string; entityId: string }) => {
      if (!data?.entityType || !data?.entityId) return;
      if (!ALLOWED_ENTITY_TYPES.has(data.entityType)) return;
      void Promise.resolve(socket.join(`${data.entityType}:${data.entityId}`));
    });

    socket.on("unsubscribe:entity", (data: { entityType: string; entityId: string }) => {
      if (!data?.entityType || !data?.entityId) return;
      if (!ALLOWED_ENTITY_TYPES.has(data.entityType)) return;
      void Promise.resolve(socket.leave(`${data.entityType}:${data.entityId}`));
    });

    // Handle disconnect
    socket.on("disconnect", (reason: string) => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }

      ctx.runFork(
        Effect.gen(function* () {
          yield* Ref.update(ctx.workspaceConnections, (map) => HashMap.remove(map, clientId));

          yield* Effect.logInfo("EVENTS: Client disconnected from workspace", {
            clientId,
            workspaceSlug,
            reason,
            connectedClients: namespace.sockets.size,
          });
        })
      );
    });
  });
};

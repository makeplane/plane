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

// Types
export type WorkspaceId = string;
export type ClientId = string;

export interface WorkspaceConnection {
  clientId: ClientId;
  workspaceId: WorkspaceId;
  userId: string;
  userEmail?: string;
  connectedAt: number;
}

export interface EventsHandlerContext {
  workspaceConnections: Ref.Ref<HashMap.HashMap<ClientId, WorkspaceConnection>>;
  runFork: <A, E>(effect: Effect.Effect<A, E, never>) => void;
}

/**
 * Setup handler for the /events/{workspaceId} namespace
 * Clients connecting to this namespace are automatically joined to their workspace room
 * Note: Authentication is handled by middleware before this handler is called
 */
export const setupEventsNamespace = (namespace: Namespace, ctx: EventsHandlerContext): void => {
  namespace.on("connection", (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const namespacePath = socket.nsp.name;
    const workspaceId = namespacePath.replace("/events/", "");
    const clientId = socket.id;

    // Get authenticated user from socket data (set by auth middleware)
    const user = authSocket.data.user;
    if (!user) {
      // This shouldn't happen as auth middleware should reject unauthenticated connections
      socket.disconnect(true);
      return;
    }

    ctx.runFork(
      Effect.gen(function* () {
        // Join the workspace room
        socket.join(`workspace:${workspaceId}`);

        // Also join a user-specific room for targeted messages
        socket.join(`user:${user.id}`);

        // Track connection with user info
        const connection: WorkspaceConnection = {
          clientId,
          workspaceId,
          userId: user.id,
          userEmail: user.email,
          connectedAt: Date.now(),
        };
        yield* Ref.update(ctx.workspaceConnections, (map) => HashMap.set(map, clientId, connection));

        // Get room stats
        const room = namespace.adapter.rooms.get(`workspace:${workspaceId}`);
        const clientsInRoom = room ? room.size : 1;

        yield* Effect.logInfo("EVENTS: Authenticated client connected to workspace", {
          clientId,
          workspaceId,
          userId: user.id,
          userEmail: user.email,
          namespace: namespacePath,
          clientsInRoom,
          remoteAddress: socket.handshake.address,
        });

        // Send connection confirmation with user info
        socket.emit("connected", {
          clientId,
          workspaceId,
          userId: user.id,
          timestamp: Date.now(),
        });
      })
    );

    // Handle custom events from client
    socket.onAny((eventName: string, ...args: unknown[]) => {
      ctx.runFork(
        Effect.logInfo("EVENTS: Received event from client", {
          clientId,
          workspaceId,
          eventName,
          args,
        })
      );
    });

    // Handle disconnect
    socket.on("disconnect", (reason: string) => {
      ctx.runFork(
        Effect.gen(function* () {
          yield* Ref.update(ctx.workspaceConnections, (map) => HashMap.remove(map, clientId));

          const room = namespace.adapter.rooms.get(`workspace:${workspaceId}`);
          const clientsInRoom = room ? room.size : 0;

          yield* Effect.logInfo("EVENTS: Client disconnected from workspace", {
            clientId,
            workspaceId,
            reason,
            clientsInRoom,
          });
        })
      );
    });
  });
};

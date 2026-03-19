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
import type { Server as SocketIOServer, Socket } from "socket.io";

export interface FluxHandlerContext {
  runFork: <A, E>(effect: Effect.Effect<A, E, never>) => void;
}

/**
 * Setup handler for the default namespace (/)
 *
 * The root namespace has no authenticated clients — the web client connects
 * only to /events/{workspaceSlug}. The consumer process uses SocketEmitter
 * (Redis-based, no socket connection) to emit events.
 *
 * We reject all connections to the root namespace to prevent unauthenticated access.
 */
export const setupFluxNamespace = (io: SocketIOServer, ctx: FluxHandlerContext): void => {
  io.on("connection", (socket: Socket) => {
    ctx.runFork(
      Effect.logWarning("FLUX: Rejecting unauthenticated connection to root namespace", {
        clientId: socket.id,
        remoteAddress: socket.handshake.address,
      })
    );
    socket.disconnect(true);
  });
};

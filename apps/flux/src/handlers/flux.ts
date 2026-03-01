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
 * Provides general pub/sub flux functionality
 */
export const setupFluxNamespace = (io: SocketIOServer, ctx: FluxHandlerContext): void => {
  io.on("connection", (socket: Socket) => {
    const clientId = socket.id;

    ctx.runFork(
      Effect.logInfo("FLUX: Client connected", {
        clientId,
        remoteAddress: socket.handshake.address,
      })
    );

    socket.emit("connected", {
      clientId,
      timestamp: Date.now(),
    });

    // Subscribe to a channel
    socket.on("subscribe", (channel: string) => {
      socket.join(channel);
      ctx.runFork(
        Effect.logInfo("FLUX: Client subscribed to channel", {
          clientId,
          channel,
        })
      );
      socket.emit("subscribed", { channel, timestamp: Date.now() });
    });

    // Unsubscribe from a channel
    socket.on("unsubscribe", (channel: string) => {
      socket.leave(channel);
      ctx.runFork(
        Effect.logInfo("FLUX: Client unsubscribed from channel", {
          clientId,
          channel,
        })
      );
      socket.emit("unsubscribed", { channel, timestamp: Date.now() });
    });

    // Broadcast to a channel
    socket.on("broadcast", (data: { channel: string; payload: unknown }) => {
      ctx.runFork(
        Effect.logInfo("FLUX: Broadcasting to channel", {
          clientId,
          channel: data.channel,
        })
      );
      socket.to(data.channel).emit("message", {
        channel: data.channel,
        payload: data.payload,
        sender: clientId,
        timestamp: Date.now(),
      });
    });

    // Ping/pong
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: Date.now() });
    });

    socket.on("disconnect", (reason: string) => {
      ctx.runFork(
        Effect.logInfo("FLUX: Client disconnected", {
          clientId,
          reason,
        })
      );
    });
  });
};

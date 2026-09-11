/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type Redis from "ioredis";
import type { WebSocket } from "ws";
import { logger } from "@plane/logger";
import type { TMembershipRealtimeEvent } from "@plane/types";
import { redisManager } from "@/redis";
import { getMembershipRealtimeChannel, shouldForwardMembershipEventToUser } from "@/utils/membership-realtime";

type TMembershipSocketContext = {
  userId: string;
};

class MembershipRealtimeHub {
  private subscriber: Redis | null = null;
  private clients = new Map<WebSocket, TMembershipSocketContext>();
  private userClients = new Map<string, Set<WebSocket>>();

  async initialize() {
    const client = redisManager.getClient();
    if (!client) {
      logger.warn("MEMBERSHIP_REALTIME: Redis unavailable, membership sockets disabled");
      return;
    }

    this.subscriber = client.duplicate();
    this.subscriber.on("message", this.handleMessage);
    this.subscriber.on("error", (error) => {
      logger.error("MEMBERSHIP_REALTIME: Subscriber error", error);
    });
    logger.info("MEMBERSHIP_REALTIME: Hub initialized");
  }

  async addClient(ws: WebSocket, context: TMembershipSocketContext) {
    this.clients.set(ws, context);
    const sockets = this.userClients.get(context.userId) ?? new Set<WebSocket>();
    sockets.add(ws);
    this.userClients.set(context.userId, sockets);

    if (sockets.size === 1) {
      await this.subscribeToUser(context.userId);
    }

    ws.on("close", () => {
      void this.removeClient(ws);
    });
    ws.on("error", () => {
      void this.removeClient(ws);
    });
  }

  private async subscribeToUser(userId: string) {
    if (!this.subscriber) return;
    const channel = getMembershipRealtimeChannel(userId);
    await this.subscriber.subscribe(channel);
    logger.info(`MEMBERSHIP_REALTIME: Subscribed to ${channel}`);
  }

  private async unsubscribeFromUser(userId: string) {
    if (!this.subscriber) return;
    const channel = getMembershipRealtimeChannel(userId);
    await this.subscriber.unsubscribe(channel);
    logger.info(`MEMBERSHIP_REALTIME: Unsubscribed from ${channel}`);
  }

  private handleMessage = (channel: string, message: string) => {
    try {
      const event = JSON.parse(message) as TMembershipRealtimeEvent;
      const userId = event.user_id;
      if (!userId) return;

      const sockets = this.userClients.get(userId);
      if (!sockets?.size) return;

      for (const ws of sockets) {
        const context = this.clients.get(ws);
        if (!context) continue;
        if (ws.readyState !== ws.OPEN) continue;
        if (
          !shouldForwardMembershipEventToUser({
            eventUserId: event.user_id,
            socketUserId: context.userId,
          })
        ) {
          continue;
        }
        ws.send(message);
      }
    } catch (error) {
      logger.error("MEMBERSHIP_REALTIME: Failed to fan out message", error);
    }
  };

  private async removeClient(ws: WebSocket) {
    const context = this.clients.get(ws);
    if (!context) return;

    this.clients.delete(ws);
    const sockets = this.userClients.get(context.userId);
    sockets?.delete(ws);
    if (sockets && sockets.size === 0) {
      this.userClients.delete(context.userId);
      await this.unsubscribeFromUser(context.userId);
    }
  }
}

export const membershipRealtimeHub = new MembershipRealtimeHub();

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type Redis from "ioredis";
import type { WebSocket } from "ws";
import { logger } from "@plane/logger";
import type { TWorkItemRealtimeEvent } from "@plane/types";
import { redisManager } from "@/redis";
import { getWorkItemRealtimeChannel, shouldForwardWorkItemEventToUser } from "@/utils/work-item-realtime";

type TWorkItemSocketContext = {
  projectId: string;
  userId: string;
  isGuest: boolean;
  guestCanViewAllWorkItems: boolean;
};

class WorkItemRealtimeHub {
  private subscriber: Redis | null = null;
  private clients = new Map<WebSocket, TWorkItemSocketContext>();
  private projectClients = new Map<string, Set<WebSocket>>();

  async initialize() {
    const client = redisManager.getClient();
    if (!client) {
      logger.warn("WORK_ITEM_REALTIME: Redis unavailable, work item sockets disabled");
      return;
    }

    this.subscriber = client.duplicate();
    this.subscriber.on("message", this.handleMessage);
    this.subscriber.on("error", (error) => {
      logger.error("WORK_ITEM_REALTIME: Subscriber error", error);
    });
    logger.info("WORK_ITEM_REALTIME: Hub initialized");
  }

  async addClient(ws: WebSocket, context: TWorkItemSocketContext) {
    this.clients.set(ws, context);
    const sockets = this.projectClients.get(context.projectId) ?? new Set<WebSocket>();
    sockets.add(ws);
    this.projectClients.set(context.projectId, sockets);

    if (sockets.size === 1) {
      await this.subscribeToProject(context.projectId);
    }

    ws.on("close", () => {
      void this.removeClient(ws);
    });
    ws.on("error", () => {
      void this.removeClient(ws);
    });
  }

  private async subscribeToProject(projectId: string) {
    if (!this.subscriber) return;
    const channel = getWorkItemRealtimeChannel(projectId);
    await this.subscriber.subscribe(channel);
    logger.info(`WORK_ITEM_REALTIME: Subscribed to ${channel}`);
  }

  private async unsubscribeFromProject(projectId: string) {
    if (!this.subscriber) return;
    const channel = getWorkItemRealtimeChannel(projectId);
    await this.subscriber.unsubscribe(channel);
    logger.info(`WORK_ITEM_REALTIME: Unsubscribed from ${channel}`);
  }

  private handleMessage = (channel: string, message: string) => {
    try {
      const event = JSON.parse(message) as TWorkItemRealtimeEvent;
      const projectId = event.project_id;
      if (!projectId) return;

      const sockets = this.projectClients.get(projectId);
      if (!sockets?.size) return;

      for (const ws of sockets) {
        const context = this.clients.get(ws);
        if (!context) continue;
        if (ws.readyState !== ws.OPEN) continue;
        if (
          !shouldForwardWorkItemEventToUser({
            actorId: event.actor_id,
            userId: context.userId,
            createdBy: event.issue?.created_by,
            isGuest: context.isGuest,
            guestCanViewAllWorkItems: context.guestCanViewAllWorkItems,
          })
        ) {
          continue;
        }
        ws.send(message);
      }
    } catch (error) {
      logger.error("WORK_ITEM_REALTIME: Failed to fan out message", error);
    }
  };

  private async removeClient(ws: WebSocket) {
    const context = this.clients.get(ws);
    if (!context) return;

    this.clients.delete(ws);
    const sockets = this.projectClients.get(context.projectId);
    sockets?.delete(ws);
    if (sockets && sockets.size === 0) {
      this.projectClients.delete(context.projectId);
      await this.unsubscribeFromProject(context.projectId);
    }
  }
}

export const workItemRealtimeHub = new WorkItemRealtimeHub();

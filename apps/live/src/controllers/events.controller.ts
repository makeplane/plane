/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Request } from "express";
import type { WebSocket } from "ws";
// plane imports
import { Controller, WebSocket as WSDecorator } from "@plane/decorators";
import { logger } from "@plane/logger";
// events
import { DefaultEventsAuth } from "@/events/auth";
import { parseEventsConfig } from "@/events/config";
import type { SocketLike } from "@/events/hub";
import { EventsHub } from "@/events/hub";
import { registerStatsSource } from "@/events/stats";
// redis
import { redisManager } from "@/redis";

@Controller("/events")
export class EventsController {
  [key: string]: unknown;
  private hub: EventsHub | null = null;

  // Any failure here is contained: the hub must never stop Hocuspocus from registering.
  constructor() {
    try {
      const config = parseEventsConfig();
      if (!config.enabled) return;
      const hub = new EventsHub({
        config,
        auth: new DefaultEventsAuth(),
        createSubscriber: () => redisManager.getClient()?.duplicate() ?? null,
      });
      hub.start().catch((error) => logger.error("EVENTS_CONTROLLER: hub failed to start", error?.message));
      this.hub = hub;
      registerStatsSource(() => hub.stats());
    } catch (error) {
      logger.error("EVENTS_CONTROLLER: hub setup failed", error instanceof Error ? error.message : "unknown");
    }
  }

  @WSDecorator("/")
  handleConnection(ws: WebSocket, req: Request) {
    if (!this.hub) {
      // flag off (or hub setup failed): close 4404, nothing else runs
      ws.close(4404, "live events disabled");
      return;
    }
    this.hub.handleConnection(ws as unknown as SocketLike, req);
  }
}

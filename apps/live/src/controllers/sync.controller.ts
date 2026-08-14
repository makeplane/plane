/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Request } from "express";
import type WSClient from "ws";
import Redis from "ioredis";
// plane imports
import { Controller, WebSocket as WSDecorator } from "@plane/decorators";
import { logger } from "@plane/logger";
// lib
import { handleAuthentication } from "@/lib/auth";
import { env } from "@/env";
// services
import { SyncEventService, type TSyncEvent } from "@/services/sync/sync-event.service";

const ONLINE_TTL_SECONDS = 45; // refreshed on each heartbeat; matches client ping cadence with margin

const onlineKey = (userId: string, workspaceId: string) => `sync:online:${userId}:${workspaceId}`;
const channelKey = (workspaceId: string) => `sync:workspace:${workspaceId}`;

type TIncomingMessage = { type: "ack"; seq: number } | { type: "ping" };

/**
 * `/sync` — real-time entity-change stream for web/iOS/macOS.
 *
 * Connection query params: `cookie` (or a JSON token like Hocuspocus's, for
 * native clients that can't hold browser cookies), `userId`, `workspaceSlug`,
 * `workspaceId`, `sinceSeq` (0 for a fresh client), and an optional `deviceId`
 * (only present for iOS/macOS, so their APNs cursor can be advanced too).
 *
 * On connect: replay everything since `sinceSeq` from Postgres via Django
 * (`SyncEventService.replay`), then switch to a live Redis subscription on
 * `sync:workspace:<id>` — matching the durable-outbox contract documented in
 * apps/api/plane/bgtasks/sync_event_task.py. Replay-then-live is de-duped by
 * `seq` on the client, since the two phases can technically overlap by one
 * event if it lands mid-replay.
 */
@Controller("/sync")
export class SyncController {
  [key: string]: unknown;

  @WSDecorator("/")
  async handleConnection(ws: WSClient, req: Request) {
    const params = new URLSearchParams(req.url?.split("?")[1] ?? "");
    const cookie = params.get("cookie") ?? req.headers.cookie ?? "";
    const userId = params.get("userId") ?? "";
    const workspaceSlug = params.get("workspaceSlug") ?? "";
    const workspaceId = params.get("workspaceId") ?? "";
    const deviceId = params.get("deviceId") ?? undefined;
    const sinceSeq = Number(params.get("sinceSeq") ?? "0") || 0;

    if (!userId || !workspaceSlug || !workspaceId) {
      ws.close(4400, "Missing required connection params");
      return;
    }

    try {
      await handleAuthentication({ cookie, userId });
    } catch (error) {
      logger.error("SYNC_CONTROLLER: authentication failed", error as Error);
      ws.close(4401, "Unauthorized");
      return;
    }

    const subscriber = env.REDIS_URL
      ? new Redis(env.REDIS_URL)
      : new Redis({ host: env.REDIS_HOST, port: Number(env.REDIS_PORT) });
    let closed = false;
    let heartbeat: ReturnType<typeof setInterval> | undefined;

    const markOnline = async () => {
      try {
        const client = subscriber.duplicate();
        await client.set(onlineKey(userId, workspaceId), "1", "EX", ONLINE_TTL_SECONDS);
        await client.quit();
      } catch (error) {
        logger.warn("SYNC_CONTROLLER: failed to refresh online marker", error as Error);
      }
    };

    const cleanup = async () => {
      if (closed) return;
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
      try {
        await subscriber.unsubscribe(channelKey(workspaceId));
        await subscriber.quit();
      } catch {
        // connection already gone — nothing to clean up
      }
    };

    try {
      // 1. Replay everything missed while offline (durable outbox in Postgres).
      const syncEventService = new SyncEventService();
      let cursor = sinceSeq;
      let hasMore = true;
      // Pagination is inherently sequential — each page's cursor depends on the previous
      // page's result — and `closed` is flipped by the "close"/"error" handlers below, so
      // both lint rules don't apply to this loop.
      // eslint-disable-next-line no-unmodified-loop-condition
      while (hasMore && !closed) {
        // eslint-disable-next-line no-await-in-loop
        const { events, has_more } = await syncEventService.replay(workspaceSlug, cursor, cookie, deviceId);
        for (const event of events) {
          ws.send(JSON.stringify({ type: "event", ...event }));
          cursor = event.seq;
        }
        hasMore = has_more;
      }

      // 2. Switch to the live stream. Subscribing only after replay completes
      //    (rather than in parallel) keeps ordering simple; any event
      //    published in between is still delivered live and the client's
      //    seq-based de-dup absorbs the rare overlap with the tail of replay.
      await subscriber.subscribe(channelKey(workspaceId));
      subscriber.on("message", (_channel: string, message: string) => {
        if (closed) return;
        try {
          const event = JSON.parse(message) as TSyncEvent & { workspace_id: string };
          if (event.seq <= cursor) return; // already delivered via replay
          ws.send(JSON.stringify({ type: "event", ...event }));
          cursor = event.seq;
        } catch (error) {
          logger.error("SYNC_CONTROLLER: failed to forward live event", error as Error);
        }
      });

      await markOnline();
      heartbeat = setInterval(markOnline, ONLINE_TTL_SECONDS * 1000 * 0.6);

      ws.on("message", (raw: WSClient.RawData) => {
        try {
          const message = JSON.parse(raw.toString()) as TIncomingMessage;
          if (message.type === "ping") markOnline();
          // "ack" is accepted for future cursor-persistence but the durable
          // cursor already advances via SyncEventService.replay's device_id
          // param and the periodic online-marker refresh covers liveness.
        } catch {
          // ignore malformed client frames
        }
      });

      ws.on("close", cleanup);
      ws.on("error", (error: Error) => {
        logger.error("SYNC_CONTROLLER: WebSocket error", error);
        cleanup();
        ws.close(1011, "Internal server error");
      });
    } catch (error) {
      logger.error("SYNC_CONTROLLER: connection setup failed", error as Error);
      await cleanup();
      ws.close(1011, "Internal server error");
    }
  }
}

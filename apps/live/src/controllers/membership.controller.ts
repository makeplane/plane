/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Request } from "express";
import type { WebSocket } from "ws";
import { Controller, WebSocket as WSDecorator } from "@plane/decorators";
import { logger } from "@plane/logger";
import { handleAuthentication } from "@/lib/auth";
import { membershipRealtimeHub } from "@/services/membership-realtime.service";

@Controller("/membership")
export class MembershipController {
  [key: string]: unknown;

  @WSDecorator("/")
  handleConnection(ws: WebSocket, req: Request) {
    void this.bindConnection(ws, req);
  }

  private async bindConnection(ws: WebSocket, req: Request) {
    try {
      const url = new URL(req.url || "", "http://localhost");
      const userId = url.searchParams.get("userId") || "";
      const cookie = req.headers.cookie?.toString();

      if (!userId || !cookie) {
        ws.close(4401, "Missing realtime credentials");
        return;
      }

      await handleAuthentication({ cookie, userId });
      await membershipRealtimeHub.addClient(ws, { userId });
    } catch (error) {
      logger.error("MEMBERSHIP_CONTROLLER: Failed to bind membership socket", error);
      ws.close(1011, "Internal server error");
    }
  }
}

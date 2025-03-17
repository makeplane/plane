import type { Request } from "express";
import type { WebSocket as WS } from "ws";
import type { Hocuspocus } from "@hocuspocus/server";
import { Controller, WebSocket } from "@/lib/decorators";
import { BaseWebSocketController } from "@/lib/base.controller";
import { AppError } from "@/core/helpers/error-handler";
import { logger } from "@plane/logger";

@Controller("/collaboration")
export class CollaborationController extends BaseWebSocketController {
  constructor(private readonly hocusPocusServer: Hocuspocus) {
    super();
  }

  @WebSocket("/")
  handleConnection(ws: WS, req: Request) {
    try {
      this.hocusPocusServer.handleConnection(ws, req);
    } catch (err) {
      logger.error("WebSocket connection error:", err);
      // Close the connection with an error code
      ws.close(1011, err instanceof AppError ? err.message : "Internal server error");
    }
  }
}

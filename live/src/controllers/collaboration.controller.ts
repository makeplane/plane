import type { Request } from "express";
import type { WebSocket as WS } from "ws";
import type { Hocuspocus } from "@hocuspocus/server";
import { Controller, WebSocket } from "@/lib/decorators";
import { IWebSocketController } from "@/lib/controller.interface";
import { AppError } from "@/core/helpers/error-handler";
import { manualLogger } from "@/core/helpers/logger";

@Controller("/collaboration")
export class CollaborationController implements IWebSocketController {
  constructor(private readonly hocusPocusServer: Hocuspocus) {}

  @WebSocket("/")
  handleConnection(ws: WS, req: Request) {
    try {
      this.hocusPocusServer.handleConnection(ws, req);
    } catch (err) {
      manualLogger.error("WebSocket connection error:", err);
      // Close the connection with an error code
      ws.close(1011, err instanceof AppError ? err.message : "Internal server error");
    }
  }
}

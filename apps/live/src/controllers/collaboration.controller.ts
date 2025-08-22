import type { Request } from "express";
import type { Hocuspocus } from "@hocuspocus/server";
import { logger } from "@plane/logger";
import { Controller, WebSocket } from "@plane/decorators";

@Controller("/collaboration")
export class CollaborationController {
  private metrics = {
    errors: 0,
  };

  constructor(private readonly hocusPocusServer: Hocuspocus) {}

  @WebSocket("/")
  handleConnection(ws: any, req: Request) {
    try {
      // Initialize the connection with Hocuspocus
      this.hocusPocusServer.handleConnection(ws, req);

      // Set up error handling for the connection
      ws.on("error", (error: any) => {
        logger.error("WebSocket connection error:", error);
        ws.close();
      });
    } catch (error) {
      logger.error("WebSocket connection error:", error);
      ws.close();
    }
  }
}

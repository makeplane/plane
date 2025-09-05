import type { Hocuspocus } from "@hocuspocus/server";
import type { Request } from "express";
// plane imports
import { Controller, WebSocket } from "@plane/decorators";
import { logger } from "@plane/logger";

@Controller("/collaboration")
export class CollaborationController {
  constructor(private readonly hocusPocusServer: Hocuspocus) {
    this.hocusPocusServer = hocusPocusServer;
  }

  @WebSocket("/")
  handleConnection(ws: any, req: Request) {
    try {
      // Initialize the connection with Hocuspocus
      this.hocusPocusServer.handleConnection(ws, req);

      // Set up error handling for the connection
      ws.on("error", (error: Error) => {
        logger.error("WebSocket connection error:", error);
        ws.close(1011, "Internal server error");
      });
    } catch (error) {
      logger.error("WebSocket connection error:", error);
      ws.close(1011, "Internal server error");
    }
  }
}

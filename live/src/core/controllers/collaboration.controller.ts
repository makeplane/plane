import { Router } from "express";
import { WebSocket } from "ws";
import { manualLogger } from "../helpers/logger.js";
import type { Hocuspocus as HocusPocusServer } from "@hocuspocus/server";

export class CollaborationController {
  constructor(private hocusPocusServer: HocusPocusServer) {
    this.hocusPocusServer = hocusPocusServer;
  }

  registerRoutes(router: Router) {
    router.ws("/collaboration", (ws: WebSocket, req) => {
      try {
        this.hocusPocusServer.handleConnection(ws, req);
      } catch (err) {
        manualLogger.error("WebSocket connection error:", err);
        ws.close();
      }
    });
  }
}

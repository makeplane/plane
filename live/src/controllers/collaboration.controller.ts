import type { Request } from "express";
import type { WebSocket as WS } from "ws";
import { Server } from "@hocuspocus/server";
import { Controller, WebSocket } from "../lib/decorators.js";

@Controller("/collaboration")
export class CollaborationController {
  constructor(private hocusPocusServer: typeof Server) {}

  @WebSocket("/")
  handleConnection(ws: WS, req: Request) {
    try {
      this.hocusPocusServer.handleConnection(ws, req);
    } catch (err) {
      console.error("WebSocket connection error:", err);
      ws.close();
    }
  }
}

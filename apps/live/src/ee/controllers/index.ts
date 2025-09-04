import { CONTROLLERS as CEControllers } from "@/ce/controllers";
import { BroadcastController } from "./broadcast.controller";
import { IframelyController } from "./iframely.controller";

export const CONTROLLERS = {
  // Core system controllers (health checks, status endpoints)
  CORE: [...CEControllers.CORE, IframelyController],

  // Document management controllers
  DOCUMENT: [...CEControllers.DOCUMENT],

  // WebSocket controllers for real-time functionality
  WEBSOCKET: [...CEControllers.WEBSOCKET, BroadcastController],
};

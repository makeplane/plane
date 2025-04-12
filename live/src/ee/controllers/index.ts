import { BroadcastController } from "./broadcast.controller";
import { CONTROLLERS as CEControllers } from "@/ce/controllers";

export const CONTROLLERS = {
  // Core system controllers (health checks, status endpoints)
  CORE: [...CEControllers.CORE],

  // Document management controllers
  DOCUMENT: [...CEControllers.DOCUMENT],

  // WebSocket controllers for real-time functionality
  WEBSOCKET: [...CEControllers.WEBSOCKET, BroadcastController],
};

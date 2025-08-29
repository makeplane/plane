// Export individual decorators
export { Controller, Middleware } from "./rest";
export { Get, Post, Put, Patch, Delete } from "./rest";
export { WebSocket } from "./websocket";
export { registerControllers } from "./controller";

// Also provide namespaced exports for better organization
import * as RestDecorators from "./rest";
import * as WebSocketDecorators from "./websocket";

// Named namespace exports
export const Rest = RestDecorators;
export const WebSocketNS = WebSocketDecorators;

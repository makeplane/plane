// Export individual decorators and controllers
export { Controller, Middleware } from './base';
export { Get, Post, Put, Patch, Delete } from './rest';
export { WebSocket } from './websocket';
export { BaseController } from './controller';
export { BaseWebSocketController } from './websocket-controller';

// Also provide namespaced exports for better organization
import * as BaseDecorators from './base';
import * as RestDecorators from './rest';
import * as WebSocketDecorators from './websocket';

// Named namespace exports
export const Base = BaseDecorators;
export const Rest = RestDecorators;
export const WebSocketNS = WebSocketDecorators; 
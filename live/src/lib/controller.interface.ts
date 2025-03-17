import { Router, Request } from "express";
import { WebSocket } from "ws";

/**
 * Base controller interface that all controllers should implement
 */
export interface IController {
  /**
   * Register routes for RESTful endpoints
   * @param router Express router to register routes on
   */
  registerRoutes?(router: Router): void;
}

/**
 * WebSocket controller interface for websocket handlers
 */
export interface IWebSocketController extends IController {
  /**
   * Handle WebSocket connections
   * @param ws WebSocket connection
   * @param req Express request object
   */
  handleConnection(ws: WebSocket, req: Request): void;
}

/**
 * Type for controller constructor
 */
export type ControllerConstructor = new (...args: any[]) => IController;


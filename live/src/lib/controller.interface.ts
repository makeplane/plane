import { Router, Request } from "express";
import { WebSocket } from "ws";
import { BaseController, BaseWebSocketController } from "./base.controller";

/**
 * Controller factory function interface for creating controllers with dependencies
 */
export type ControllerFactory<T extends BaseController = BaseController> = (dependencies: any) => T;

/**
 * Interface for controller registration with optional dependencies
 */
export interface ControllerRegistration {
  Controller: new (...args: any[]) => BaseController; 
  dependencies?: string[];
}

/**
 * Interface for WebSocket controller registration with optional dependencies
 */
export interface WebSocketControllerRegistration {
  Controller: new (...args: any[]) => BaseWebSocketController;
  dependencies?: string[];
}

/**
 * Controller registry interface for organizing controllers
 */
export interface IControllerRegistry {
  controllers: ControllerRegistration[];
  webSocketControllers: WebSocketControllerRegistration[];
}

/**
 * Service container interface for dependency management
 */
export interface IServiceContainer {
  get(serviceName: string): any;
  register(serviceName: string, service: any): void;
}

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


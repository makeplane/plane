import { Router, Request } from "express";
import type { WebSocket } from "ws";
import "reflect-metadata";

/**
 * Base controller class for WebSocket endpoints
 */
export abstract class BaseWebSocketController {
  protected router: Router;

  constructor() {
    this.router = Router();
  }

  /**
   * Get the base route for this controller
   */
  protected getBaseRoute(): string {
    return Reflect.getMetadata("baseRoute", this.constructor) || "";
  }

  /**
   * Register all WebSocket routes for this controller
   * @param router - Express router with WebSocket support
   * @param errorHandler - Optional function to handle WebSocket errors
   */
  public registerWebSocketRoutes(
    router: any, 
    errorHandler?: (ws: WebSocket, req: Request, error: unknown) => void
  ): void {
    const baseRoute = this.getBaseRoute();
    const proto = Object.getPrototypeOf(this);
    const methods = Object.getOwnPropertyNames(proto).filter(
      (item) => item !== "constructor" && typeof (this as any)[item] === "function"
    );

    // Register the handleConnection method as the WebSocket handler
    methods.forEach((methodName) => {
      const route = Reflect.getMetadata("route", proto, methodName) || "";
      const method = Reflect.getMetadata("method", proto, methodName) as string;
      const middlewares = Reflect.getMetadata("middlewares", proto, methodName) || [];

      if (route && method && method === "ws") {
        const fullRoute = baseRoute + route;
        const handler = (this as any)[methodName].bind(this);

        // Only process WebSocket routes in this controller
        if (method === "ws" && typeof router.ws === "function") {
          router.ws(fullRoute, (ws: WebSocket, req: Request) => {
            try {
              handler(ws, req);
            } catch (error: unknown) {
              if (errorHandler) {
                errorHandler(ws, req, error);
              } else {
                // Default error handling
                console.error(`WebSocket error in ${this.constructor.name}.${methodName}`, error);
                ws.close(1011, error instanceof Error ? error.message : "Internal server error");
              }
            }
          });
        }
      }
    });
  }

  /**
   * Abstract method to handle WebSocket connections
   * Implement this in your derived class
   */
  abstract handleConnection(ws: WebSocket, req: Request): void;
} 
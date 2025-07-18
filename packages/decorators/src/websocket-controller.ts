import { Router, Request } from "express";
import type { WebSocket } from "ws";
import "reflect-metadata";

interface ControllerInstance {
  [key: string]: unknown;
}

interface ControllerConstructor {
  new (...args: unknown[]): ControllerInstance;
  prototype: ControllerInstance;
}

export function registerWebSocketControllers(
  router: Router,
  Controller: ControllerConstructor,
  existingInstance?: ControllerInstance,
): void {
  const instance = existingInstance || new Controller();
  const baseRoute = Reflect.getMetadata("baseRoute", Controller) as string;

  Object.getOwnPropertyNames(Controller.prototype).forEach((methodName) => {
    if (methodName === "constructor") return; // Skip the constructor

    const method = Reflect.getMetadata(
      "method",
      instance,
      methodName,
    ) as string;
    const route = Reflect.getMetadata("route", instance, methodName) as string;

    if (method === "ws" && route) {
      const handler = instance[methodName] as unknown;

      if (
        typeof handler === "function" &&
        "ws" in router &&
        typeof router.ws === "function"
      ) {
        router.ws(`${baseRoute}${route}`, (ws: WebSocket, req: Request) => {
          try {
            handler.call(instance, ws, req);
          } catch (error) {
            console.error(
              `WebSocket error in ${Controller.name}.${methodName}`,
              error,
            );
            ws.close(
              1011,
              error instanceof Error ? error.message : "Internal server error",
            );
          }
        });
      }
    }
  });
}

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
   * Abstract method to handle WebSocket connections
   * Implement this in your derived class
   */
  abstract handleConnection(ws: WebSocket, req: Request): void;
}

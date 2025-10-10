import type { RequestHandler, Router, Request } from "express";
import type { WebSocket } from "ws";

import "reflect-metadata";

export type HttpMethod = "get" | "post" | "put" | "delete" | "patch" | "options" | "head" | "ws";

type ControllerInstance = {
  [key: string]: any;
};

export type ControllerConstructor = {
  new (...args: any[]): ControllerInstance;
  prototype: ControllerInstance;
};

export function registerController(
  router: Router,
  Controller: ControllerConstructor,
  dependencies: unknown[] = []
): void {
  // Create the controller instance with dependencies
  const instance = new Controller(...dependencies);

  // Determine if it's a WebSocket controller or REST controller by checking
  // if it has any methods with the "ws" method metadata
  const isWebsocket = Object.getOwnPropertyNames(Controller.prototype).some((methodName) => {
    if (methodName === "constructor") return false;
    return Reflect.getMetadata("method", instance, methodName) === "ws";
  });

  if (isWebsocket) {
    // Register as WebSocket controller
    // Pass the existing instance with dependencies to avoid creating a new instance without them
    registerWebSocketController(router, Controller, instance);
  } else {
    // Register as REST controller with the existing instance
    registerRestController(router, Controller, instance);
  }
}

function registerRestController(
  router: Router,
  Controller: ControllerConstructor,
  existingInstance?: ControllerInstance
): void {
  const instance = existingInstance || new Controller();
  const baseRoute = Reflect.getMetadata("baseRoute", Controller) as string;

  Object.getOwnPropertyNames(Controller.prototype).forEach((methodName) => {
    if (methodName === "constructor") return; // Skip the constructor

    const method = Reflect.getMetadata("method", instance, methodName) as HttpMethod;
    const route = Reflect.getMetadata("route", instance, methodName) as string;
    const middlewares = (Reflect.getMetadata("middlewares", instance, methodName) as RequestHandler[]) || [];

    if (method && route) {
      const handler = instance[methodName] as unknown;

      if (typeof handler === "function") {
        if (method !== "ws") {
          (router[method] as (path: string, ...handlers: RequestHandler[]) => void)(
            `${baseRoute}${route}`,
            ...middlewares,
            handler.bind(instance)
          );
        }
      }
    }
  });
}

function registerWebSocketController(
  router: Router,
  Controller: ControllerConstructor,
  existingInstance?: ControllerInstance
): void {
  const instance = existingInstance || new Controller();
  const baseRoute = Reflect.getMetadata("baseRoute", Controller) as string;

  Object.getOwnPropertyNames(Controller.prototype).forEach((methodName) => {
    if (methodName === "constructor") return; // Skip the constructor

    const method = Reflect.getMetadata("method", instance, methodName) as string;
    const route = Reflect.getMetadata("route", instance, methodName) as string;

    if (method === "ws" && route) {
      const handler = instance[methodName] as unknown;

      if (typeof handler === "function" && "ws" in router && typeof router.ws === "function") {
        router.ws(`${baseRoute}${route}`, (ws: WebSocket, req: Request) => {
          try {
            handler.call(instance, ws, req);
          } catch (error) {
            console.error(`WebSocket error in ${Controller.name}.${methodName}`, error);
            ws.close(1011, error instanceof Error ? error.message : "Internal server error");
          }
        });
      }
    }
  });
}

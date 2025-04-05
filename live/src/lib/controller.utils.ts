import { Router } from "express";
import { registerControllers as registerRestControllers, registerWebSocketControllers } from "@plane/decorators";
import "reflect-metadata";

/**
 * Register all controllers from the controllers array
 * @param router Express router to register routes on
 * @param controllers Array of controller classes to register
 * @param dependencies Array of dependencies to pass to controllers
 */
export function registerControllers(router: Router, controllers: any[], dependencies: any[] = []): void {
  controllers.forEach((Controller) => {
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
      registerWebSocketControllers(router, Controller, instance);
    } else {
      // Register as REST controller - doesn't accept an instance parameter
      registerRestControllers(router, Controller);
    }
  });
}

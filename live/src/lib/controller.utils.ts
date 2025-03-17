import { Router } from "express";
import { ControllerConstructor } from "./controller.interface";
import "reflect-metadata";

// Define valid HTTP methods
type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'all' | 'use' | 'options' | 'head' | 'ws';

/**
 * Register controller routes with the provided router
 * @param router Express router to register routes on
 * @param controllers Array of controller classes to register
 */
export function registerControllers(router: Router, controllers: ControllerConstructor[]): void {
  for (const Controller of controllers) {
    const instance = new Controller();
    
    // Call registerRoutes if the controller implements it
    if (instance.registerRoutes) {
      instance.registerRoutes(router);
    }
    
    // Handle controllers with decorators
    const baseRoute = Reflect.getMetadata("baseRoute", Controller) || "";
    if (baseRoute) {
      const proto = Object.getPrototypeOf(instance);
      const methods = Object.getOwnPropertyNames(proto).filter(
        (item) => item !== "constructor" && typeof (instance as any)[item] === "function"
      );

      methods.forEach((methodName) => {
        const route = Reflect.getMetadata("route", proto, methodName) || "";
        const method = Reflect.getMetadata("method", proto, methodName) as HttpMethod;
        const middlewares = Reflect.getMetadata("middlewares", proto, methodName) || [];

        if (route && method && method !== "ws") { // Skip WebSocket routes as they're handled differently
          // Use type assertion to tell TypeScript that method is a valid key for router
          (router as any)[method](baseRoute + route, ...middlewares, (instance as any)[methodName].bind(instance));
        }
      });
    }
  }
} 
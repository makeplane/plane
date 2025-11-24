import "reflect-metadata";
import type { RequestHandler } from "express";

// Define valid HTTP methods
type RestMethod = "get" | "post" | "put" | "patch" | "delete";

/**
 * Controller decorator
 * @param baseRoute
 * @returns
 */
export function Controller(baseRoute: string = ""): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return function (target: Function) {
    Reflect.defineMetadata("baseRoute", baseRoute, target);
  };
}

/**
 * Factory function to create HTTP method decorators
 * @param method HTTP method to handle
 * @returns Method decorator
 */
function createHttpMethodDecorator(method: RestMethod): (route: string) => MethodDecorator {
  return function (route: string): MethodDecorator {
    return function (target: object, propertyKey: string | symbol) {
      Reflect.defineMetadata("method", method, target, propertyKey);
      Reflect.defineMetadata("route", route, target, propertyKey);
    };
  };
}

// Export HTTP method decorators using the factory
export const Get = createHttpMethodDecorator("get");
export const Post = createHttpMethodDecorator("post");
export const Put = createHttpMethodDecorator("put");
export const Patch = createHttpMethodDecorator("patch");
export const Delete = createHttpMethodDecorator("delete");

/**
 * Middleware decorator
 * @param middleware
 * @returns
 */
export function Middleware(middleware: RequestHandler): MethodDecorator {
  return function (target: object, propertyKey: string | symbol) {
    const middlewares = Reflect.getMetadata("middlewares", target, propertyKey) || [];
    middlewares.push(middleware);
    Reflect.defineMetadata("middlewares", middlewares, target, propertyKey);
  };
}

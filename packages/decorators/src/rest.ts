import "reflect-metadata";
import { RequestHandler } from "express";

/**
 * Controller decorator
 * @param baseRoute
 * @returns
 */
export function Controller(baseRoute: string = ""): ClassDecorator {
  return function (target: Function) {
    Reflect.defineMetadata("baseRoute", baseRoute, target);
  };
}

/**
 * Controller GET method decorator
 * @param route
 * @returns
 */
export function Get(route: string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    Reflect.defineMetadata("method", "get", target, propertyKey);
    Reflect.defineMetadata("route", route, target, propertyKey);
  };
}

/**
 * Controller POST method decorator
 * @param route
 * @returns
 */
export function Post(route: string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    Reflect.defineMetadata("method", "post", target, propertyKey);
    Reflect.defineMetadata("route", route, target, propertyKey);
  };
}

/**
 * Controller PATCH method decorator
 * @param route
 * @returns
 */
export function Patch(route: string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    Reflect.defineMetadata("method", "patch", target, propertyKey);
    Reflect.defineMetadata("route", route, target, propertyKey);
  };
}

/**
 * Controller PUT method decorator
 * @param route
 * @returns
 */
export function Put(route: string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    Reflect.defineMetadata("method", "put", target, propertyKey);
    Reflect.defineMetadata("route", route, target, propertyKey);
  };
}

/**
 * Controller DELETE method decorator
 * @param route
 * @returns
 */
export function Delete(route: string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    Reflect.defineMetadata("method", "delete", target, propertyKey);
    Reflect.defineMetadata("route", route, target, propertyKey);
  };
}

/**
 * Middleware decorator
 * @param middleware
 * @returns
 */
export function Middleware(middleware: RequestHandler): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const middlewares =
      Reflect.getMetadata("middlewares", target, propertyKey) || [];
    middlewares.push(middleware);
    Reflect.defineMetadata("middlewares", middlewares, target, propertyKey);
  };
}

import "reflect-metadata";
import type { RequestHandler } from "express";

/**
 * Class decorator to define a base route for a controller
 */
export const Controller = (baseRoute = ""): ClassDecorator => {
  return function (target: object) {
    Reflect.defineMetadata("baseRoute", baseRoute, target);
  };
};

/**
 * Method decorator to apply middleware to a controller method
 */
export const Middleware = (middleware: RequestHandler): MethodDecorator => {
  return function (target: object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) {
    const middlewares = Reflect.getMetadata("middlewares", target, propertyKey) || [];
    middlewares.push(middleware);
    Reflect.defineMetadata("middlewares", middlewares, target, propertyKey);
  };
}; 
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-wrapper-object-types */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import "reflect-metadata";
import { RequestHandler } from "express";
// external middlewares
import { validateUserAuthentication } from "@/middleware/auth.middleware";
import { checkIntegrationAvailability } from "@/helpers/app";
import { E_INTEGRATION_KEYS } from "@plane/etl/core";
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
 * @param baseRoute
 * @returns
 */
export function Get(route: string): any {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("method", "get", target, propertyKey);
    Reflect.defineMetadata("route", route, target, propertyKey);
  };
}
/**
 * Controller POST method decorator
 * @param baseRoute
 * @returns
 */
export function Post(route: string): any {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("method", "post", target, propertyKey);
    Reflect.defineMetadata("route", route, target, propertyKey);
  };
}

/**
 * Controller PATCH method decorator
 * @param baseRoute
 * @returns
 */
export function Patch(route: string): any {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("method", "patch", target, propertyKey);
    Reflect.defineMetadata("route", route, target, propertyKey);
  };
}

/**
 * Controller PUT method decorator
 * @param baseRoute
 * @returns
 */
export function Put(route: string): any {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("method", "put", target, propertyKey);
    Reflect.defineMetadata("route", route, target, propertyKey);
  };
}

/**
 * Controller DELETE method decorator
 * @param baseRoute
 * @returns
 */
export function Delete(route: string): any {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("method", "delete", target, propertyKey);
    Reflect.defineMetadata("route", route, target, propertyKey);
  };
}

/**
 * Middle method decorator
 * @param baseRoute
 * @returns
 */
export function Middleware(middleware: RequestHandler): any {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const middlewares = Reflect.getMetadata("middlewares", target, propertyKey) || [];
    middlewares.push(middleware);
    Reflect.defineMetadata("middlewares", middlewares, target, propertyKey);
  };
}

export const useValidateUserAuthentication =
  () => (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const [req, res, next] = args;

      // Create and immediately invoke middleware
      const middleware = validateUserAuthentication();

      return new Promise((resolve, reject) => {
        middleware(req, res, (err) => {
          if (err) return reject(err);

          // If middleware passes, call original method with external API token
          resolve(originalMethod.apply(this, [...args.slice(0, -1), req.externalApiToken]));
        });
      });
    };

    return descriptor;
  };

export const EnsureEnabled = (key: E_INTEGRATION_KEYS) =>
  function <T extends { new (...args: any[]): unknown }>(constructor: T) {
    // Get the prototype of the class
    const prototype = constructor.prototype;

    // Get all property names of the class prototype
    const propertyNames = Object.getOwnPropertyNames(prototype);

    // Iterate through all properties
    propertyNames.forEach((propertyName) => {
      // Get property descriptor
      const descriptor = Object.getOwnPropertyDescriptor(prototype, propertyName);

      // Skip if not a method or if it's constructor
      if (!(descriptor?.value instanceof Function) || propertyName === "constructor") {
        return;
      }

      // Store the original method
      const originalMethod = descriptor.value;

      // Create new method with the integration check
      descriptor.value = async function (...args: any[]) {
        const [req, res, next] = args;

        const isEnabled = checkIntegrationAvailability(key);

        if (!isEnabled) {
          return res
            .status(403)
            .send({ message: "Integration not configured, please contact your instance administrator." });
        }

        return originalMethod.apply(this, args);
      };

      // Redefine the property with the new descriptor
      Object.defineProperty(prototype, propertyName, descriptor);
    });

    return constructor;
  };

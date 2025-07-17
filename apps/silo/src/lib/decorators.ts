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

type Constructor = {
  new (...args: any[]): any;
};
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
 * Decorator factory for inheriting from multiple controller classes
 * @param subControllers Array of parent controller classes to inherit from
 */
export function ConnectSubController(subControllers: Constructor[]) {
  return function <T extends Constructor>(target: T) {
    // Process each parent controller
    subControllers.forEach((subController) => {
      // Get parent metadata
      const parentMethods = Object.getOwnPropertyNames(subController.prototype).filter(
        (name) => name !== "constructor"
      );

      // Copy parent methods and their metadata to child
      parentMethods.forEach((methodName) => {
        // Skip if method already exists in target
        if (!target.prototype[methodName]) {
          const method = subController.prototype[methodName];
          target.prototype[methodName] = method;

          // Copy method metadata
          const route = Reflect.getMetadata("route", subController.prototype, methodName);
          const httpMethod = Reflect.getMetadata("method", subController.prototype, methodName);
          const middlewares = Reflect.getMetadata("middlewares", subController.prototype, methodName) || [];

          if (route) {
            Reflect.defineMetadata("route", route, target.prototype, methodName);
          }
          if (httpMethod) {
            Reflect.defineMetadata("method", httpMethod, target.prototype, methodName);
          }
          if (middlewares.length > 0) {
            Reflect.defineMetadata("middlewares", middlewares, target.prototype, methodName);
          }
        }
      });

      // Copy class-level decorators
      const parentDecorators = Reflect.getMetadata("decorators", subController) || [];
      parentDecorators.forEach((decorator: ClassDecorator) => {
        decorator(target);
      });

      // Copy class-level metadata
      const parentMetadataKeys = Reflect.getMetadataKeys(subController);
      parentMetadataKeys.forEach((key) => {
        const metadata = Reflect.getMetadata(key, subController);
        if (!Reflect.hasMetadata(key, target)) {
          Reflect.defineMetadata(key, metadata, target);
        }
      });
    });

    return target;
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
export function Middleware(middleware: RequestHandler | RequestHandler[]) {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    // Convert single middleware to array
    const middlewareArray = Array.isArray(middleware) ? middleware : [middleware];

    // Get existing middlewares or initialize empty array
    const existingMiddlewares: RequestHandler[] = Reflect.getMetadata("middlewares", target, propertyKey) || [];

    // Combine existing and new middlewares
    const updatedMiddlewares = [...existingMiddlewares, ...middlewareArray];

    // Store the combined middlewares
    Reflect.defineMetadata("middlewares", updatedMiddlewares, target, propertyKey);

    return descriptor;
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

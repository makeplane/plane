import { RequestHandler, Router } from "express";
import "reflect-metadata";

type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "delete"
  | "patch"
  | "options"
  | "head"
  | "ws";

interface ControllerInstance {
  [key: string]: unknown;
}

interface ControllerConstructor {
  new (...args: any[]): ControllerInstance;
  prototype: ControllerInstance;
}

export function registerControllers(
  router: Router,
  Controller: ControllerConstructor,
): void {
  const instance = new Controller();
  const baseRoute = Reflect.getMetadata("baseRoute", Controller) as string;

  Object.getOwnPropertyNames(Controller.prototype).forEach((methodName) => {
    if (methodName === "constructor") return; // Skip the constructor

    const method = Reflect.getMetadata(
      "method",
      instance,
      methodName,
    ) as HttpMethod;
    const route = Reflect.getMetadata("route", instance, methodName) as string;
    const middlewares =
      (Reflect.getMetadata(
        "middlewares",
        instance,
        methodName,
      ) as RequestHandler[]) || [];

    if (method && route) {
      const handler = instance[methodName] as unknown;

      if (typeof handler === "function") {
        if (method !== "ws") {
          (
            router[method] as (
              path: string,
              ...handlers: RequestHandler[]
            ) => void
          )(`${baseRoute}${route}`, ...middlewares, handler.bind(instance));
        }
      }
    }
  });
}

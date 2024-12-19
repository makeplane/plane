import "reflect-metadata";
import type { Router } from "express";

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export const registerControllers = (router: Router, Controller: any): void => {
  const instance = new Controller();
  const baseRoute = Reflect.getMetadata("baseRoute", Controller) || "";

  const proto = Object.getPrototypeOf(instance);
  const methods = Object.getOwnPropertyNames(proto).filter(
    (item) => item !== "constructor" && typeof instance[item] === "function"
  );

  methods.forEach((methodName) => {
    const route = Reflect.getMetadata("route", proto, methodName) || "";
    const method = Reflect.getMetadata("method", proto, methodName) as HttpMethod;
    const middlewares = Reflect.getMetadata("middlewares", proto, methodName) || [];

    if (route && method) {
      router[method](baseRoute + route, ...middlewares, instance[methodName].bind(instance));
    }
  });
};

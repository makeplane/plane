/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-wrapper-object-types */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
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

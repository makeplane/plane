import "reflect-metadata";
import { RequestHandler } from "express";

export function Controller(baseRoute: string = ""): ClassDecorator {
  return function (target: Function) {
    Reflect.defineMetadata("baseRoute", baseRoute, target);
  };
}

export function Get(route: string): any {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "get", target, propertyKey);
  };
}

export function Post(route: string): any {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "post", target, propertyKey);
  };
}

export function Put(route: string): any {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "put", target, propertyKey);
  };
}

export function Patch(route: string): any {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "patch", target, propertyKey);
  };
}

export function Delete(route: string): any {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "delete", target, propertyKey);
  };
}

export function Middleware(middleware: RequestHandler): any {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const middlewares = Reflect.getMetadata("middlewares", target, propertyKey) || [];
    middlewares.push(middleware);
    Reflect.defineMetadata("middlewares", middlewares, target, propertyKey);
  };
}

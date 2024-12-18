import "reflect-metadata";
import type { RequestHandler } from "express";

export const Controller = (baseRoute: string = ""): ClassDecorator => {
  return function (target: Function) {
    Reflect.defineMetadata("baseRoute", baseRoute, target);
  };
};

export const Get = (route: string): MethodDecorator => {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "get", target, propertyKey);
  };
};

export const Post = (route: string): MethodDecorator => {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "post", target, propertyKey);
  };
};

export const Put = (route: string): MethodDecorator => {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "put", target, propertyKey);
  };
};

export const Patch = (route: string): MethodDecorator => {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "patch", target, propertyKey);
  };
};

export const Delete = (route: string): MethodDecorator => {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "delete", target, propertyKey);
  };
};

export const Middleware = (middleware: RequestHandler): MethodDecorator => {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const middlewares = Reflect.getMetadata("middlewares", target, propertyKey) || [];
    middlewares.push(middleware);
    Reflect.defineMetadata("middlewares", middlewares, target, propertyKey);
  };
};

export const WebSocket = (route: string): MethodDecorator => {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "ws", target, propertyKey);
  };
};

import "reflect-metadata";
import type { RequestHandler } from "express";
import { asyncHandler } from "@/core/helpers/error-reporting";

export const Controller = (baseRoute = ""): ClassDecorator => {
  return function (target: object) {
    Reflect.defineMetadata("baseRoute", baseRoute, target);
  };
};

export const Get = (route: string): MethodDecorator => {
  return function (target: object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "get", target, propertyKey);
  };
};

export const Post = (route: string): MethodDecorator => {
  return function (target: object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "post", target, propertyKey);
  };
};

export const Put = (route: string): MethodDecorator => {
  return function (target: object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "put", target, propertyKey);
  };
};

export const Patch = (route: string): MethodDecorator => {
  return function (target: object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "patch", target, propertyKey);
  };
};

export const Delete = (route: string): MethodDecorator => {
  return function (target: object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "delete", target, propertyKey);
  };
};

export const Middleware = (middleware: RequestHandler): MethodDecorator => {
  return function (target: object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) {
    const middlewares = Reflect.getMetadata("middlewares", target, propertyKey) || [];
    middlewares.push(middleware);
    Reflect.defineMetadata("middlewares", middlewares, target, propertyKey);
  };
};

export const WebSocket = (route: string): MethodDecorator => {
  return function (target: object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "ws", target, propertyKey);
  };
};

/**
 * Decorator to wrap controller methods with error handling
 * This automatically catches and processes all errors using our error handling system
 */
export const CatchErrors = (): MethodDecorator => {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    // Only apply to methods that are not WebSocket handlers
    const isWebSocketHandler = Reflect.getMetadata("method", target, propertyKey) === "ws";
    
    if (typeof originalMethod === 'function' && !isWebSocketHandler) {
      descriptor.value = asyncHandler(originalMethod);
    }
    
    return descriptor;
  };
};
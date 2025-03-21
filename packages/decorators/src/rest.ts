import "reflect-metadata";

/**
 * GET method decorator
 */
export const Get = (route: string): MethodDecorator => {
  return function (target: object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "get", target, propertyKey);
  };
};

/**
 * POST method decorator
 */
export const Post = (route: string): MethodDecorator => {
  return function (target: object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "post", target, propertyKey);
  };
};

/**
 * PUT method decorator
 */
export const Put = (route: string): MethodDecorator => {
  return function (target: object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "put", target, propertyKey);
  };
};

/**
 * PATCH method decorator
 */
export const Patch = (route: string): MethodDecorator => {
  return function (target: object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "patch", target, propertyKey);
  };
};

/**
 * DELETE method decorator
 */
export const Delete = (route: string): MethodDecorator => {
  return function (target: object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "delete", target, propertyKey);
  };
}; 
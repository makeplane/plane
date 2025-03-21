import "reflect-metadata";

/**
 * WebSocket method decorator
 */
export const WebSocket = (route: string): MethodDecorator => {
  return function (target: object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", route, target, propertyKey);
    Reflect.defineMetadata("method", "ws", target, propertyKey);
  };
}; 
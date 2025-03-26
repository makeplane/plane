import "reflect-metadata";

/**
 * WebSocket method decorator
 * @param route
 * @returns
 */
export function WebSocket(route: string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    Reflect.defineMetadata("method", "ws", target, propertyKey);
    Reflect.defineMetadata("route", route, target, propertyKey);
  };
}

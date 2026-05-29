import "reflect-metadata";

/**
 * WebSocket method decorator
 * @param route
 * @returns
 */
export function WebSocket(route: string): MethodDecorator {
  return function (target: object, propertyKey: string | symbol) {
    Reflect.defineMetadata("method", "ws", target, propertyKey);
    Reflect.defineMetadata("route", route, target, propertyKey);
  };
}

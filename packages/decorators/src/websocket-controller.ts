import "reflect-metadata";

interface ControllerInstance {
  [key: string]: unknown;
}

interface ControllerConstructor {
  new (...args: any[]): ControllerInstance;
  prototype: ControllerInstance;
}

export function registerWebSocketController(
  router: any,
  Controller: ControllerConstructor,
  dependencies: any[] = []
): void {
  const instance = new Controller(...dependencies);
  const baseRoute = Reflect.getMetadata("baseRoute", Controller);

  Object.getOwnPropertyNames(Controller.prototype).forEach((methodName) => {
    if (methodName === "constructor") return; // Skip the constructor

    const method = Reflect.getMetadata("method", instance, methodName);
    const route = Reflect.getMetadata("route", instance, methodName);

    if (method === "ws" && route) {
      const handler = instance[methodName] as unknown;

      if (
        typeof handler === "function" &&
        typeof (router as any).ws === "function"
      ) {
        router.ws(`${baseRoute}${route}`, (ws: any, req: any) => {
          try {
            handler.call(instance, ws, req);
          } catch (error) {
            console.error(
              `WebSocket error in ${Controller.name}.${methodName}`,
              error
            );
            ws.close(
              1011,
              error instanceof Error ? error.message : "Internal server error"
            );
          }
        });
      }
    }
  });
}

import { Router, Request } from "express";
import { WebSocket } from "ws";
import "reflect-metadata";

export abstract class BaseController {
  protected router: Router;

  constructor() {
    this.router = Router();
  }

  /**
   * Get the base route for this controller
   */
  protected getBaseRoute(): string {
    return Reflect.getMetadata("baseRoute", this.constructor) || "";
  }

  /**
   * Register all routes for this controller
   */
  public registerRoutes(router: Router): void {
    const baseRoute = this.getBaseRoute();
    const proto = Object.getPrototypeOf(this);
    const methods = Object.getOwnPropertyNames(proto).filter(
      (item) => item !== "constructor" && typeof (this as any)[item] === "function"
    );

    methods.forEach((methodName) => {
      const route = Reflect.getMetadata("route", proto, methodName) || "";
      const method = Reflect.getMetadata("method", proto, methodName) as string;
      const middlewares = Reflect.getMetadata("middlewares", proto, methodName) || [];

      if (route && method) {
        const fullRoute = baseRoute + route;
        const handler = (this as any)[methodName].bind(this);

        if (method === "ws") {
          // Handle WebSocket routes
          (router as any).ws(fullRoute, (ws: WebSocket, req: Request) => {
            handler(ws, req);
          });
        } else {
          // Handle HTTP routes
          (router as any)[method](fullRoute, ...middlewares, handler);
        }
      }
    });

    // Mount this controller's router on the main router
    router.use(baseRoute, this.router);
  }
}

export abstract class BaseWebSocketController extends BaseController {
  abstract handleConnection(ws: WebSocket, req: Request): void;
} 
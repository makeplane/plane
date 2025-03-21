import { Router, Request, Response, NextFunction } from "express";
import "reflect-metadata";

/**
 * Base controller class that provides route registration functionality
 */
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
   * @param router - Express router to register routes on
   * @param errorHandler - Optional function to wrap handlers with error handling
   */
  public registerRoutes(
    router: Router, 
    errorHandler?: (handler: (req: Request, res: Response, next: NextFunction) => Promise<any> | any) => any
  ): void {
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
        
        // Skip WebSocket routes in this base controller
        if (method !== "ws") {
          const wrappedHandler = errorHandler ? errorHandler(handler) : handler;
          (router as any)[method](fullRoute, ...middlewares, wrappedHandler);
        }
      }
    });

    // Mount this controller's router on the main router
    router.use(baseRoute, this.router);
  }
} 
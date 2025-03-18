import { Router, Request } from "express";
import { WebSocket } from "ws";
import "reflect-metadata";
import Errors from "@/core/helpers/error-handling/error-factory";
import { ErrorCategory ,asyncHandler} from "@/core/helpers/error-handling/error-handler";
import { logger } from "@plane/logger";

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
          // Handle WebSocket routes with error handling for graceful failures
          (router as any).ws(fullRoute, (ws: WebSocket, req: Request) => {
            try {
              handler(ws, req);
            } catch (error: unknown) {
              // Convert to AppError if needed
              const appError = Errors.convertError(error instanceof Error ? error : new Error(String(error)), {
                context: {
                  controller: this.constructor.name,
                  method: methodName,
                  route: fullRoute,
                  requestId: req.id || "unknown",
                },
              });

              logger.error(`WebSocket error in ${this.constructor.name}.${methodName}`, {
                error: appError,
              });

              // Send error message to client before closing
              try {
                ws.send(
                  JSON.stringify({
                    type: "error",
                    message:
                      appError.category === ErrorCategory.OPERATIONAL ? appError.message : "Internal server error",
                  })
                );
              } catch (sendError) {
                // Ignore send errors at this point
              }

              // Close the connection with an appropriate code
              ws.close(1011, appError.message);
            }
          });
        } else {
          (router as any)[method](fullRoute, ...middlewares, asyncHandler(handler));
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


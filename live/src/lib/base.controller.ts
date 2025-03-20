import { Router, Request } from "express";
import { WebSocket } from "ws";
import "reflect-metadata";
import Errors from "@/core/helpers/error-handling/error-factory";
import { ErrorCategory ,asyncHandler} from "@/core/helpers/error-handling/error-handler";
import { logger } from "@plane/logger";
import { BaseController as DecoratorBaseController, BaseWebSocketController as DecoratorBaseWebSocketController } from "@plane/decorators";

// Use the new package's controller as the base class
export abstract class BaseController extends DecoratorBaseController {
  constructor() {
    super();
  }

  /**
   * Get the base route for this controller
   */
  protected getBaseRoute(): string {
    return Reflect.getMetadata("baseRoute", this.constructor) || "";
  }

  /**
   * Register all routes for this controller with error handling
   */
  public registerRoutes(router: Router): void {
    // Use the parent class's method with our custom error handler
    super.registerRoutes(router, asyncHandler);
  }
}

// Use the new package's WebSocket controller as the base class
export abstract class BaseWebSocketController extends DecoratorBaseWebSocketController {
  constructor() {
    super();
  }

  /**
   * Register all WebSocket routes for this controller with error handling
   */
  public registerWebSocketRoutes(router: any): void {
    // Use the parent class's method with our custom error handler
    super.registerWebSocketRoutes(router, (ws: WebSocket, req: Request, error: unknown) => {
      // Convert to AppError if needed
      const appError = Errors.convertError(error instanceof Error ? error : new Error(String(error)), {
        context: {
          controller: this.constructor.name,
          requestId: req.id || "unknown",
        },
      });

      logger.error(`WebSocket error in ${this.constructor.name}`, {
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
    });
  }
}


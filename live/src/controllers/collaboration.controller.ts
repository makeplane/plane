import type { Request } from "express";
import type { WebSocket as WS } from "ws";
import type { Hocuspocus } from "@hocuspocus/server";
import { ErrorCategory } from "@/core/helpers/error-handling/error-handler";
import { logger } from "@plane/logger";
import Errors from "@/core/helpers/error-handling/error-factory";
import { Controller, WebSocket } from "@plane/decorators";

@Controller("/collaboration")
export class CollaborationController {
  private metrics = {
    errors: 0,
  };

  constructor(private readonly hocusPocusServer: Hocuspocus) {}

  @WebSocket("/")
  handleConnection(ws: WS, req: Request) {
    const clientInfo = {
      ip: req.ip,
      userAgent: req.get("user-agent"),
      requestId: req.id || crypto.randomUUID(),
    };

    try {
      // Initialize the connection with Hocuspocus
      this.hocusPocusServer.handleConnection(ws, req);

      // Set up error handling for the connection
      ws.on("error", (error) => {
        this.handleConnectionError(error, clientInfo, ws);
      });
    } catch (error) {
      this.handleConnectionError(error, clientInfo, ws);
    }
  }

  private handleConnectionError(error: unknown, clientInfo: Record<string, any>, ws: WS) {
    // Convert to AppError if needed
    const appError = Errors.convertError(error instanceof Error ? error : new Error(String(error)), {
      context: {
        ...clientInfo,
        component: "WebSocketConnection",
      },
    });

    // Log at appropriate level based on error category
    if (appError.category === ErrorCategory.OPERATIONAL) {
      logger.info(`WebSocket operational error: ${appError.message}`, {
        error: appError,
        clientInfo,
      });
    } else {
      logger.error(`WebSocket error: ${appError.message}`, {
        error: appError,
        clientInfo,
        stack: appError.stack,
      });
    }

    // Alert if error threshold is reached
    if (this.metrics.errors % 10 === 0) {
      logger.warn(`High WebSocket error rate detected: ${this.metrics.errors} total errors`);
    }

    // Try to send error to client before closing
    try {
      if (ws.readyState === ws.OPEN) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: appError.category === ErrorCategory.OPERATIONAL ? appError.message : "Internal server error",
          })
        );
      }
    } catch (sendError) {
      // Ignore send errors at this point
    }

    // Close with informative message if connection is still open
    if (ws.readyState === ws.OPEN) {
      ws.close(
        1011,
        appError.category === ErrorCategory.OPERATIONAL
          ? `Error: ${appError.message}. Reconnect with exponential backoff.`
          : "Internal server error. Please retry in a few moments."
      );
    }
  }

  getErrorMetrics() {
    return {
      errors: this.metrics.errors,
    };
  }
}

import { Server as HttpServer } from "http";
import { logger } from "@plane/logger";
import { handleError } from "./helpers/error-handling/error-factory";

/**
 * Handles graceful shutdown and process signal management for the HTTP server.
 */
class ShutdownManager {
  private httpServer: HttpServer | null = null;

  /**
   * Register the HTTP server instance to be shut down later.
   */
  register({ httpServer }: { httpServer: HttpServer }) {
    this.httpServer = httpServer;
  }

  /**
   * Register process termination signal handlers.
   */
  registerTerminationHandlers(): void {
    const gracefulTermination = this.getGracefulTerminationHandler();
    process.on("SIGTERM", gracefulTermination);
    process.on("SIGINT", gracefulTermination);

    process.on("uncaughtException", (error) => {
      logger.error("Uncaught exception:", error);

      handleError(error, {
        errorType: "internal",
        component: "process",
        operation: "uncaughtException",
        extraContext: { source: "uncaughtException" },
      });
    });

    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled rejection:", reason);
      handleError(reason, {
        errorType: "internal",
        component: "process",
        operation: "unhandledRejection",
        extraContext: { source: "unhandledRejection" },
      });
    });
  }

  /**
   * Returns a handler that gracefully shuts down the HTTP server.
   */
  private getGracefulTerminationHandler(): () => Promise<void> {
    return async () => {
      logger.info("Signal received, shutting down HTTP server");
      await this.shutdown();
    };
  }

  /**
   * Gracefully shuts down the registered HTTP server.
   */
  async shutdown(message?: string, exitCode = 0): Promise<void> {
    logger.error(`Initiating graceful shutdown ${`${message ? `with message: ${message}` : ""}`}`);

    if (this.httpServer) {
      this.httpServer.closeAllConnections?.();
      await new Promise<void>((resolve) => {
        this.httpServer?.close(() => resolve());
      });
    }
    process.exit(exitCode);
  }
}

export const shutdownManager = new ShutdownManager();

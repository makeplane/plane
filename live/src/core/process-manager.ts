// server
import { Server } from "http";
// hocuspocus server
import type { Hocuspocus } from "@hocuspocus/server";
// logger
import { logger } from "@plane/logger";
// config
import { serverConfig } from "@/config/server-config";
// error handling
import { handleError } from "@/core/helpers/error-handling/error-factory";

/**
 * ProcessManager handles graceful process termination and resource cleanup
 */
export class ProcessManager {
  private readonly hocusPocusServer: Hocuspocus;
  private readonly httpServer: Server;

  /**
   * Initialize the process manager
   * @param hocusPocusServer Hocuspocus server instance
   * @param httpServer HTTP server instance
   */
  constructor(hocusPocusServer: Hocuspocus, httpServer: Server) {
    this.hocusPocusServer = hocusPocusServer;
    this.httpServer = httpServer;
  }

  /**
   * Register process termination signal handlers
   */
  registerTerminationHandlers(): void {
    const gracefulTermination = this.getGracefulTerminationHandler();

    // Handle process signals
    process.on("SIGTERM", gracefulTermination);
    process.on("SIGINT", gracefulTermination);

    // Handle uncaught exceptions - create AppError but DON'T terminate
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught exception:", error);
      // Create AppError to track the issue but don't terminate
      handleError(error, {
        errorType: "internal",
        component: "process",
        operation: "uncaughtException",
        extraContext: { source: "uncaughtException" }
      });
    });

    // Handle unhandled promise rejections - create AppError but DON'T terminate
    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled rejection:", reason);
      // Create AppError to track the issue but don't terminate
      handleError(reason, {
        errorType: "internal",
        component: "process",
        operation: "unhandledRejection",
        extraContext: { source: "unhandledRejection" }
      });
    });
  }

  /**
   * Get the graceful termination handler
   * @returns Termination function
   */
  private getGracefulTerminationHandler(): () => Promise<void> {
    return async () => {
      logger.info("Starting graceful termination...");

      let hasTerminationCompleted = false;

      // Create a timeout that will force exit if termination takes too long
      const forceExitTimeout = setTimeout(() => {
        if (!hasTerminationCompleted) {
          logger.error("Forcing termination after timeout - some connections may not have closed gracefully.");
          process.exit(1);
        }
      }, serverConfig.terminationTimeout);

      // Destroy Hocuspocus server first
      logger.info("Stopping Hocuspocus server...");
      let hocuspocusStopSuccessful = false;

      try {
        await this.hocusPocusServer.destroy();
        hocuspocusStopSuccessful = true;
        logger.info("HocusPocus server WebSocket connections closed gracefully.");
      } catch (error) {
        hocuspocusStopSuccessful = false;
        logger.error("Error during hocuspocus server termination:", error);
        // Continue with HTTP server termination even if Hocuspocus termination fails
      } finally {
        logger.info(
          `Proceeding to HTTP server termination. Hocuspocus termination ${hocuspocusStopSuccessful ? "was successful" : "had errors"}.`
        );
      }

      // Close HTTP server
      try {
        logger.info("Initiating HTTP server termination...");
        this.httpServer.close(() => {
          logger.info("HTTP server closed gracefully - all connections ended.");

          // Clear the timeout since we're terminating gracefully
          clearTimeout(forceExitTimeout);
          hasTerminationCompleted = true;

          process.exit(0);
        });
        logger.info("HTTP server close initiated, waiting for connections to end...");
      } catch (error) {
        logger.error("Error during HTTP server termination:", error);
        clearTimeout(forceExitTimeout);
        process.exit(1);
      }
    };
  }
} 
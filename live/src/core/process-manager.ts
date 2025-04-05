// server
import { Server } from "http";
// hocuspocus server
import type { Hocuspocus } from "@hocuspocus/server";
// logger
import { logger } from "@plane/logger";
// config
// error handling
import { handleError } from "@/core/helpers/error-handling/error-factory";
// shutdown manager
import { ShutdownManager } from "@/core/shutdown-manager";

/**
 * ProcessManager handles graceful process termination and resource cleanup
 */
export class ProcessManager {
  private readonly hocusPocusServer: Hocuspocus;
  private readonly httpServer: Server;
  private shutdownManager: ShutdownManager;

  /**
   * Initialize the process manager
   * @param hocusPocusServer Hocuspocus server instance
   * @param httpServer HTTP server instance
   */
  constructor(hocusPocusServer: Hocuspocus, httpServer: Server) {
    this.hocusPocusServer = hocusPocusServer;
    this.httpServer = httpServer;
    this.shutdownManager = ShutdownManager.getInstance();
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
        extraContext: { source: "uncaughtException" },
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
        extraContext: { source: "unhandledRejection" },
      });
    });
  }

  /**
   * Get the graceful termination handler
   * @returns Termination function
   */
  private getGracefulTerminationHandler(): () => Promise<void> {
    return async () => {
      // Check if ShutdownManager is already handling a shutdown
      if (this.shutdownManager.isShutdownInProgress()) {
        logger.info("Shutdown already in progress via ShutdownManager, deferring to its process");
        return;
      }

      logger.info("Signal received, delegating to ShutdownManager for graceful termination");
      await this.shutdownManager.shutdown("Process termination signal received", 1);
    };
  }
}


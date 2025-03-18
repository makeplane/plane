// server
import { Server } from "http";
// hocuspocus server
import type { Hocuspocus } from "@hocuspocus/server";
// logger
import { logger } from "@plane/logger";
// config
import { serverConfig } from "@/config/server-config";

/**
 * ShutdownManager handles graceful shutdown of server resources
 */
export class ShutdownManager {
  private readonly hocusPocusServer: Hocuspocus;
  private readonly httpServer: Server;

  /**
   * Initialize the shutdown manager
   * @param hocusPocusServer Hocuspocus server instance
   * @param httpServer HTTP server instance
   */
  constructor(hocusPocusServer: Hocuspocus, httpServer: Server) {
    this.hocusPocusServer = hocusPocusServer;
    this.httpServer = httpServer;
  }

  /**
   * Register shutdown handlers with the process
   */
  registerShutdownHandlers(): void {
    const gracefulShutdown = this.getGracefulShutdown();

    // Handle process signals
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught exception:", error);
      gracefulShutdown();
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled rejection:", reason);
      gracefulShutdown();
    });
  }

  /**
   * Get the graceful shutdown handler
   * @returns Shutdown function
   */
  private getGracefulShutdown(): () => Promise<void> {
    return async () => {
      logger.info("Starting graceful shutdown...");

      let hasShutdownCompleted = false;

      // Create a timeout that will force exit if shutdown takes too long
      const forceExitTimeout = setTimeout(() => {
        if (!hasShutdownCompleted) {
          logger.error("Forcing shutdown after timeout - some connections may not have closed gracefully.");
          process.exit(1);
        }
      }, serverConfig.shutdownTimeout);

      // Destroy Hocuspocus server first
      logger.info("Shutting down Hocuspocus server...");
      let hocuspocusShutdownSuccessful = false;

      try {
        await this.hocusPocusServer.destroy();
        hocuspocusShutdownSuccessful = true;
        logger.info("HocusPocus server WebSocket connections closed gracefully.");
      } catch (error) {
        hocuspocusShutdownSuccessful = false;
        logger.error("Error during hocuspocus server shutdown:", error);
        // Continue with HTTP server shutdown even if Hocuspocus shutdown fails
      } finally {
        logger.info(
          `Proceeding to HTTP server shutdown. Hocuspocus shutdown ${hocuspocusShutdownSuccessful ? "was successful" : "had errors"}.`
        );
      }

      // Close HTTP server
      try {
        logger.info("Initiating HTTP server shutdown...");
        this.httpServer.close(() => {
          logger.info("HTTP server closed gracefully - all connections ended.");

          // Clear the timeout since we're shutting down gracefully
          clearTimeout(forceExitTimeout);
          hasShutdownCompleted = true;

          process.exit(0);
        });
        logger.info("HTTP server close initiated, waiting for connections to end...");
      } catch (error) {
        logger.error("Error during HTTP server shutdown:", error);
        clearTimeout(forceExitTimeout);
        process.exit(1);
      }
    };
  }
}

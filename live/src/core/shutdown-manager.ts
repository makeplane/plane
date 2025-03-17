import { Server } from "http";
import type { Hocuspocus } from "@hocuspocus/server";
import { logger } from "@plane/logger";
import { AppError } from "@/core/helpers/error-handler";
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
      
      try {
        // Destroy Hocuspocus server first
        await this.hocusPocusServer.destroy();
        logger.info("HocusPocus server WebSocket connections closed gracefully.");

        // Close HTTP server
        this.httpServer.close(() => {
          logger.info("HTTP server closed gracefully.");
          process.exit(0);
        });
      } catch (error) {
        logger.error("Error during shutdown:", error);
        if (error instanceof AppError) throw error;
        throw new AppError(`Graceful shutdown failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Safety timeout to force exit if graceful shutdown takes too long
      setTimeout(() => {
        logger.error("Forcing shutdown after timeout...");
        process.exit(1);
      }, serverConfig.shutdownTimeout);
    };
  }
} 
import { Server as HttpServer } from "http";
import { Hocuspocus } from "@hocuspocus/server";
import { logger } from "@plane/logger";
import { RedisManager } from "@/core/lib/redis-manager";
// config
import { serverConfig } from "@/config/server-config";
import { Server } from "http";

// Global flag to prevent duplicate shutdown sequences
let isGlobalShutdownInProgress = false;

/**
 * ShutdownManager - Handles graceful shutdown of all server components
 *
 * Implements the singleton pattern to ensure only one shutdown sequence
 * can be initiated throughout the application.
 */
export class ShutdownManager {
  private static instance: ShutdownManager;
  private httpServer: HttpServer | null = null;
  private hocuspocusServer: Hocuspocus | null = null;
  private isShuttingDown = false;
  private exitCode = 0;
  private forceExitTimeout: NodeJS.Timeout | null = null;

  // Private constructor to enforce singleton pattern
  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): ShutdownManager {
    if (!ShutdownManager.instance) {
      ShutdownManager.instance = new ShutdownManager();
    }
    return ShutdownManager.instance;
  }

  /**
   * Register server instances that need to be gracefully closed during shutdown
   */
  public register(httpServer: Server, hocuspocusServer: Hocuspocus): void {
    this.httpServer = httpServer;
    this.hocuspocusServer = hocuspocusServer;
    logger.info("ShutdownManager registered with server instances");
  }

  /**
   * Check if a shutdown is in progress
   */
  public isShutdownInProgress(): boolean {
    return this.isShuttingDown || isGlobalShutdownInProgress;
  }

  /**
   * Initiate graceful shutdown sequence
   * @param reason Reason for shutdown
   * @param exitCode Process exit code (default: 0)
   */
  public async shutdown(reason: string, exitCode = 0): Promise<void> {
    // Prevent multiple shutdown attempts
    if (this.isShuttingDown || isGlobalShutdownInProgress) {
      logger.warn("Shutdown already in progress, ignoring additional shutdown request");
      return;
    }

    this.isShuttingDown = true;
    isGlobalShutdownInProgress = true;
    this.exitCode = exitCode;

    logger.info(`Initiating graceful shutdown: ${reason}`);

    // Create a timeout to force exit if shutdown takes too long
    this.forceExitTimeout = setTimeout(() => {
      logger.error("Forcing termination after timeout - some connections may not have closed gracefully.");
      process.exit(1);
    }, serverConfig.terminationTimeout || 10000); // Default to 10 seconds if not configured

    try {
      // Close components in order: Redis, HocusPocus, HTTP server
      await this.closeRedisConnections();
      await this.closeHocusPocusServer();
      await this.closeHttpServer();

      // Wait a bit to allow handles to close
      await new Promise((resolve) => setTimeout(resolve, 1000));

      logger.warn("All components shut down successfully");
    } catch (error) {
      logger.error("Error during graceful shutdown:", error);
    } finally {
      // Clear timeout if we've made it this far
      if (this.forceExitTimeout) {
        clearTimeout(this.forceExitTimeout);
      }

      // Give a small delay before exiting to ensure all handles are closed
      setTimeout(() => {
        console.info(`Exiting process with code ${this.exitCode}`);
        process.exit(this.exitCode);
      }, 100);
    }
  }

  /**
   * Close Redis connections
   */
  private async closeRedisConnections(): Promise<void> {
    console.info("Closing Redis connections...");
    try {
      const redisManager = RedisManager.getInstance();
      const redisClient = redisManager.getClient();

      if (redisClient) {
        await redisClient.quit();
        console.info("Redis connections closed successfully");
      } else {
        console.info("No Redis connections to close");
      }
    } catch (error) {
      console.error("Error closing Redis connections:", error);
    }
  }

  /**
   * Close HocusPocus server
   */
  private async closeHocusPocusServer(): Promise<void> {
    console.info("Shutting down HocusPocus server...");
    try {
      if (this.hocuspocusServer) {
        await this.hocuspocusServer.destroy();
        console.info("HocusPocus server shut down successfully");
      } else {
        console.info("No HocusPocus server to shut down");
      }
    } catch (error) {
      console.error("Error shutting down HocusPocus server:", error);
    }
  }

  /**
   * Close HTTP server
   */
  private async closeHttpServer(): Promise<void> {
    logger.info("Closing HTTP server...");
    return new Promise<void>((resolve) => {
      if (!this.httpServer) {
        console.info("No HTTP server to close");
        resolve();
        return;
      }

      // Close all connections
      this.httpServer.closeAllConnections?.();

      this.httpServer.close((error) => {
        if (error) {
          console.error("Error closing HTTP server:", error);
        } else {
          console.info("HTTP server closed successfully");
        }
        resolve();
      });
    });
  }
}

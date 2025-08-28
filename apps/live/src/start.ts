import { logger } from "@plane/logger";
import { handleError } from "@/core/helpers/error-handling/error-factory";
import { env } from "./env";
import { Server } from "./server";

/**
 * The main entry point for the application
 * Starts the server and handles any startup errors
 */
const startServer = async () => {
  try {
    // Log server startup details
    logger.info(`Starting Plane Live server in ${env.NODE_ENV} environment`);

    // Initialize and start the server
    const server = await new Server().initialize();
    await server.start();

    logger.info(`Server running at base path: ${env.LIVE_BASE_PATH}`);
  } catch (error) {
    logger.error("Failed to start server:", error);

    // Create an AppError but DON'T exit
    handleError(error, {
      errorType: "internal",
      component: "startup",
      operation: "startServer",
      extraContext: { environment: env.NODE_ENV },
    });

    // Continue running even if startup had issues
    logger.warn("Server encountered errors during startup but will continue running");
  }
};

// Start the server
startServer();

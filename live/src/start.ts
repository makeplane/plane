import { Server } from "./server";
import { env } from "./env";
import { logger } from "@plane/logger";

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
    process.exit(1);
  }
};

// Start the server
startServer();

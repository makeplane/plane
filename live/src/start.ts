import "./core/config/sentry-config.js";
import { Server } from "./server.js";
import { manualLogger } from "./core/helpers/logger.js";

const startServer = async () => {
  try {
    const server = await new Server().initialize();
    await server.start();
  } catch (error) {
    manualLogger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

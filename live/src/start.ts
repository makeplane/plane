import "@/core/config/sentry-config";
import { Server } from "@/server";
import { manualLogger } from "@/core/helpers/logger";

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

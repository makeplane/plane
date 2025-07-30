import { Server } from "./server";
import { logger } from "@plane/logger";

let server: Server;

async function startServer() {
  server = new Server();

  try {
    await server.initialize();
    server.listen();
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown on unhandled rejection
process.on("unhandledRejection", async (err: any) => {
  logger.info("Unhandled Rejection: ", err);
  logger.info(`UNHANDLED REJECTION! 💥 Shutting down...`);
  if (server) {
    await server.destroy();
  }
});

// Graceful shutdown on uncaught exception
process.on("uncaughtException", async (err: any) => {
  logger.info("Uncaught Exception: ", err);
  logger.info(`UNCAUGHT EXCEPTION! 💥 Shutting down...`);
  if (server) {
    await server.destroy();
  }
});

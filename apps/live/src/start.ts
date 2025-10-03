import { logger } from "@plane/logger";
import { Server } from "./server";

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
process.on("unhandledRejection", async (err: Error) => {
  logger.error(`UNHANDLED REJECTION!`, err);
  try {
    // if (server) {
    //   await server.destroy();
    // }
  } finally {
    // logger.info("Exiting process...");
    // process.exit(1);
  }
});

// Graceful shutdown on uncaught exception
process.on("uncaughtException", async (err: Error) => {
  logger.error(`UNCAUGHT EXCEPTION!`, err);
  try {
    // if (server) {
    //   await server.destroy();
    // }
  } finally {
    // logger.info("Exiting process...");
    // process.exit(1);
  }
});

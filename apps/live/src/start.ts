import { Server } from "./server";
import { logger } from "@plane/logger";

const server = new Server();
server.listen();

// Graceful shutdown on unhandled rejection
process.on("unhandledRejection", async (err: any) => {
  logger.info("Unhandled Rejection: ", err);
  logger.info(`UNHANDLED REJECTION! 💥 Shutting down...`);
  await server.destroy();
});

// Graceful shutdown on uncaught exception
process.on("uncaughtException", async (err: any) => {
  logger.info("Uncaught Exception: ", err);
  logger.info(`UNCAUGHT EXCEPTION! 💥 Shutting down...`);
  await server.destroy();
});

import { logger } from "./logger";
import { Server } from "./server";
import taskManager from "@/apps/engine/worker";
import "source-map-support/register";

// Start the worker for taking over the migration jobs
try {
  taskManager.start({
    appType: "api",
  });
  logger.info("All Good! Booted (source -> plane) worker ⛑︎⛑︎⛑︎");
} catch (error) {
  logger.error("Error starting (source -> plane) worker ~ ", error);
}

const server = new Server();
server.start();

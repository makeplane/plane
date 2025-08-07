import DB from "@/db/client";
import { importTaskManger, integrationTaskManager, celeryProducer } from "@/worker";
import { env } from "@/env";
import { logger } from "./logger";
import Server from "./server";
import { initializeS3Client, Store } from "./worker/base";

(async () => {
  try {
    const store = Store.getInstance();
    await store.connect();
    // connect to db
    const db = DB.getInstance();
    await db.init();

    initializeS3Client();
    // Start the worker for taking over the migration jobs
    logger.info("Warming up worker instance, connecting services... ♨️");

    try {
      await importTaskManger.start({
        appType: "import-tasks",
        queueName: "silo-imports",
        routingKey: "silo-imports",
      });

      await integrationTaskManager.start({
        appType: "integration-tasks",
        queueName: "silo-integrations",
        routingKey: "silo-integrations",
      });

      await celeryProducer.start({
        appType: "extension",
        queueName: env.IMPORTERS_QUEUE_NAME,
        routingKey: env.IMPORTERS_QUEUE_NAME,
        exchange: env.IMPORTERS_QUEUE_NAME,
      });

      logger.info("All Good! Booted (source -> plane) worker ⛑︎⛑︎⛑︎");
      const server: Server = new Server();
      server.start();
    } catch (error) {
      logger.error("Error starting services:", error);
    }
  } catch (error) {
    logger.error("Fatal error during startup:", error);
  }
})();

// Handle process signals
process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM signal. Initiating graceful shutdown...");
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("Received SIGINT signal. Killing node process...");
  process.exit(1);
});

// Handle uncaught errors
process.on("uncaughtException", async (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", async (error) => {
  logger.error("Unhandled Rejection:", error);
  process.exit(1);
});

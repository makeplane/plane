import { logger } from "@plane/logger";
import DB from "@/db/client";
import { env } from "@/env";
import { importTaskManger, integrationTaskManager, celeryProducer } from "@/worker";
import Server from "./server";
import { initializeS3Client, Store } from "./worker/base";

// Enum for service names
enum ServiceType {
  API = "api",
  IMPORTS = "imports",
  INTEGRATIONS = "integrations",
}

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
      await importTaskManger.initialize({
        appType: "import-tasks",
        queueName: "silo-imports",
        routingKey: "silo-imports",
      });

      await integrationTaskManager.initialize({
        appType: "integration-tasks",
        queueName: "silo-integrations",
        routingKey: "silo-integrations",
      });

      await celeryProducer.initialize({
        appType: "extension",
        queueName: env.IMPORTERS_QUEUE_NAME,
        routingKey: env.IMPORTERS_QUEUE_NAME,
        exchange: env.IMPORTERS_QUEUE_NAME,
      });

      logger.info("All Good! Starting services... ⛑︎⛑︎⛑︎");

      // take an argument from the command line to start the server or the worker
      // based on the argument, we need to start one of the service types
      // if nothing is specified, start all three services

      const args = process.argv.slice(2);

      if (args.length === 0) {
        await importTaskManger.start();
        await integrationTaskManager.start();
        const server: Server = new Server();
        server.start();
        return;
      }

      // if none of api, imports, integrations are specified, throw error
      if (!args.some((arg) => Object.values(ServiceType).includes(arg as ServiceType))) {
        logger.error(`No argument specified. Please specify one of ${Object.values(ServiceType).join(", ")}`);
        process.exit(1);
      }

      if (args.includes(ServiceType.API)) {
        const server: Server = new Server();
        server.start();
      }
      if (args.includes(ServiceType.IMPORTS)) {
        await importTaskManger.start();
      }
      if (args.includes(ServiceType.INTEGRATIONS)) {
        await integrationTaskManager.start();
      }
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

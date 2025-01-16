import { importTaskManger, integrationTaskManager, celeryProducer } from "@/apps/engine/worker";
import { logger } from "./logger";
import Server from "./server";

// Start the worker for taking over the migration jobs
logger.info("Warming up worker instance, connecting services... ♨️");
try {
  importTaskManger.start({
    appType: "import-tasks",
    queueName: "silo-imports",
    routingKey: "silo-imports",
  });
  integrationTaskManager.start({
    appType: "integration-tasks",
    queueName: "silo-integrations",
    routingKey: "silo-integrations",
  });
  celeryProducer.start({
    appType: "extension",
    queueName: "celery",
    routingKey: "celery",
    exchange: "celery",
  });
  logger.info("All Good! Booted (source -> plane) worker ⛑︎⛑︎⛑︎");
} catch (error) {
  logger.error("Error starting (source -> plane) worker ~ ", error);
  throw error;
}

const server: Server = new Server();
server.start();

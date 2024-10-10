import { logger } from "@/logger";
import { MQ } from "./base";
import { Store } from "./base";
import { TaskHandler, TaskHeaders } from "@/types";
import { JiraDataMigrator } from "@/apps/jira-importer/migrator/jira.migrator";
import { LinearDataMigrator } from "@/apps/linear-importer/migrator/linear.migrator";
import { TMQEntityOptions } from "./base/types";

class WorkerFactory {
  static createWorker(type: string, mq: MQ, store: Store): TaskHandler {
    switch (type) {
      case "jira":
        return new JiraDataMigrator(mq, store);
      case "linear":
        return new LinearDataMigrator(mq, store);
      default:
        throw new Error(`Unsupported worker type: ${type}`);
    }
  }
}

interface JobWorkerConfig {
  workerTypes: { [key: string]: string };
  retryAttempts: number;
  retryDelay: number;
}

export class TaskManager {
  private mq: MQ | undefined;
  private store: Store | undefined;
  private config: JobWorkerConfig;
  private workers: Map<string, TaskHandler> = new Map();

  constructor(config: JobWorkerConfig) {
    this.config = config;

    process.on("SIGINT", this.cleanup.bind(this));
    process.on("SIGTERM", this.cleanup.bind(this));
    process.on("exit", this.cleanup.bind(this));
  }

  private initQueue = async (options: TMQEntityOptions) => {
    try {
      this.mq = new MQ(options);
      await this.mq.connect();
    } catch (error) {
      throw error;
    }
  };

  private initStore = async () => {
    try {
      this.store = new Store();
      await this.store.connect();
    } catch (error) {
      throw error;
    }
  };

  private cleanup = async () => {
    if (this.store) {
      await this.store.clean();
    }
  };

  private startConsumer = async () => {
    if (!this.mq) return;
    try {
      await this.mq.startConsuming(async (msg: any) => {
        try {
          const data = JSON.parse(msg.content.toString());
          const headers = msg.properties.headers;
          await this.handleTask(headers.headers, data);
          await this.mq?.ackMessage(msg);
        } catch (error) {
          logger.error("Error processing message:", error);
          await this.handleError(msg, error);
        }
      });
    } catch (error) {
      logger.error("Error starting job worker consumer:", error);
    }
  };

  private async handleTask(headers: TaskHeaders, data: any) {
    const worker = this.workers.get(headers.route);
    if (!worker) {
      throw new Error(`No worker found for route: ${headers.route}`);
    }
    await worker.handleTask(headers, data);
  }

  private async handleError(msg: any, error: any) {
    if (!this.mq) return;
    const retryCount = (msg.properties.headers.retry_count || 0) + 1;
    if (retryCount <= this.config.retryAttempts) {
      await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay));
      await this.mq.nackMessage(msg);
      msg.properties.headers.retry_count = retryCount;
    } else {
      logger.error(`Max retry attempts reached for message: ${msg.content.toString()}`);
      await this.mq.ackMessage(msg);
    }
  }

  public start = async (options: TMQEntityOptions) => {
    logger.info("Warming up worker instance, connecting services... ♨️");
    try {
      await this.initQueue(options);
      await this.initStore();
      await this.startConsumer();

      for (const [jobType, workerType] of Object.entries(this.config.workerTypes)) {
        this.workers.set(jobType, WorkerFactory.createWorker(workerType, this.mq!, this.store!));
      }
    } catch (error) {
      logger.error(`Something went wrong while initiating job worker 🧨, ${error}`);
    }
  };

  public registerTask = async (headers: TaskHeaders, data: any) => {
    if (!this.mq) return;
    try {
      await this.mq.sendMessage(data, { headers });
    } catch (error) {
      logger.error("Error pushing to job worker queue:", error);
    }
  };
}

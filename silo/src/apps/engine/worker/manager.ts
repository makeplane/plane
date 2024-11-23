import { AsanaDataMigrator } from "@/apps/asana-importer/migrator";
import { GithubWebhookWorker } from "@/apps/github/workers";
import { PlaneGithubWebhookWorker } from "@/apps/github/workers/plane";
import { GitlabWebhookWorker } from "@/apps/gitlab";
import { JiraDataMigrator } from "@/apps/jira-importer/migrator/jira.migrator";
import { LinearDataMigrator } from "@/apps/linear-importer/migrator/linear.migrator";
import { PlaneSlackWebhookWorker } from "@/apps/slack/worker/plane-worker";
import { SlackInteractionHandler } from "@/apps/slack/worker/worker";
import { logger } from "@/logger";
import { TaskHandler, TaskHeaders } from "@/types";
import { MQ, Store } from "./base";
import { TMQEntityOptions } from "./base/types";

class WorkerFactory {
  static createWorker(type: string, mq: MQ, store: Store): TaskHandler {
    switch (type) {
      case "jira":
        return new JiraDataMigrator(mq, store);
      case "linear":
        return new LinearDataMigrator(mq, store);
      case "asana":
        return new AsanaDataMigrator(mq, store);
      case "github-webhook":
        return new GithubWebhookWorker(mq, store);
      case "gitlab-webhook":
        return new GitlabWebhookWorker(mq, store);
      case "plane-github-webhook":
        return new PlaneGithubWebhookWorker(mq, store);
      case "slack-interaction":
        return new SlackInteractionHandler(mq, store);
      case "plane-slack-webhook":
        return new PlaneSlackWebhookWorker(mq, store);
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

type TaskProps =
  | {
      type: "mq";
      headers: TaskHeaders;
      data: any;
    }
  | {
      type: "store";
      event: string;
    };

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
    if (!this.mq || !this.store) return;
    try {
      this.store.addListener("ready", (data) => {
        const props: TaskProps = {
          type: "store",
          event: data,
        };

        this.handleTask(props);
      });

      await this.mq.startConsuming(async (msg: any) => {
        try {
          const data = JSON.parse(msg.content.toString());
          const headers = msg.properties.headers;
          const props: TaskProps = {
            type: "mq",
            headers: headers.headers,
            data: data,
          };
          await this.handleTask(props);
          await this.mq?.ackMessage(msg);
        } catch (error) {
          logger.error("Error processing message:");
          console.log(error);
          await this.handleError(msg, error);
        }
      });
    } catch (error) {
      logger.error("Error starting job worker consumer:", error);
    }
  };

  private async handleTask(props: TaskProps) {
    if (props.type === "store") {
      // Validate the event recieved
      const chunks = props.event.split(":");
      // For Issues: silo:{worker}:{type}:{action}:{entity}
      // For Comments: silo:{worker}:{type}:{action}:{entity}
      if (chunks.length >= 5) {
        const worker = this.workers.get(chunks[1]);
        if (!worker) {
          throw new Error(`No worker found for route: ${chunks[1]}`);
        }
        const headers: TaskHeaders = {
          route: chunks[1],
          jobId: chunks[3],
          type: chunks[2],
        };
        // Join the remaining chunks to get the entity
        const entity = chunks.slice(4).join(":");
        const data = JSON.parse(entity);
        await worker.handleTask(headers, data);
      }
    } else {
      const worker = this.workers.get(props.headers.route);
      if (!worker) {
        throw new Error(`No worker found for route: ${props.headers.route}`);
      }
      await worker.handleTask(props.headers, props.data);
    }
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

  public registerStoreTask = async (headers: TaskHeaders, data: any, ttl?: number) => {
    if (!this.store) return;
    try {
      await this.store.set(`silo:${headers.route}:${headers.type}:${headers.jobId}:${JSON.stringify(data)}`, "1", ttl);
    } catch (error) {
      logger.error("Error pushing to job worker queue:", error);
    }
  };
}

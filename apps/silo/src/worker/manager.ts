/*
 * Worker Manager - Core Task Management System
 * This module provides a robust task management system for handling various types of workers
 * including data migrators (Jira, Linear, Asana) and webhook handlers (GitHub, GitLab, Slack).
 * It implements a message queue-based architecture with retry mechanisms and error handling.
 */

import { AsanaDataMigrator } from "@/apps/asana-importer/migrator";
import { ClickUpAdditionalDataMigrator } from "@/apps/clickup-importer/migrator/clickup-additional.migrator";
import { ClickUpDataMigrator } from "@/apps/clickup-importer/migrator/clickup.migrator";
import { FlatfileMigrator } from "@/apps/flatfile/migrator/flatfile.migrator";
import { GithubWebhookWorker } from "@/apps/github/workers";
import { PlaneGithubWebhookWorker } from "@/apps/github/workers/plane";
import { GitlabWebhookWorker } from "@/apps/gitlab";
import { JiraDataMigrator } from "@/apps/jira-importer/migrator/jira.migrator";
import { JiraDataCenterMigrator } from "@/apps/jira-server-importer/migrator";
import { LinearDocsMigrator } from "@/apps/linear-importer/migrator/linear-docs.migrator";
import { LinearDataMigrator } from "@/apps/linear-importer/migrator/linear.migrator";
import { NotionDataMigrator } from "@/apps/notion-importer/worker";
import { PlaneSlackWebhookWorker } from "@/apps/slack/worker/plane-worker";
import { SlackInteractionHandler } from "@/apps/slack/worker/worker";
import { captureException, logger } from "@/logger";
import { TaskHandler, TaskHeaders } from "@/types";
import { MQ, s3Client, Store } from "./base";
import { Lock } from "./base/lock";
import { TMQEntityOptions } from "./base/types";
import { SentryPlaneWebhookHandler, SentryWebhookHandler } from "@/apps/sentry/worker/worker";

// It's 30 mins, but we want to be safe and set it to 25 minutes
const MQ_CONSUMER_TIMEOUT = 25 * 60 * 1000; // 25 minutes

/**
 * Factory class for creating different types of task workers
 * @class WorkerFactory
 */
class WorkerFactory {
  /**
   * Creates a worker instance based on the specified type
   * @param {string} type - The type of worker to create
   * @param {MQ} mq - Message Queue instance for handling tasks
   * @param {Store} store - Store instance for data persistence
   * @returns {TaskHandler} Instance of the specified worker type
   * @throws {Error} When an unsupported worker type is specified
   */
  static createWorker(type: string, mq: MQ, store: Store): TaskHandler {
    switch (type) {
      case "jira":
        return new JiraDataMigrator(mq, store);
      case "jira_server":
        return new JiraDataCenterMigrator(mq, store);
      case "linear":
        return new LinearDataMigrator(mq, store);
      case "linear_docs":
        return new LinearDocsMigrator(mq, store);
      case "asana":
        return new AsanaDataMigrator(mq, store);
      case "notion":
        return new NotionDataMigrator(mq, store, s3Client);
      case "confluence":
        return new NotionDataMigrator(mq, store, s3Client);
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
      case "sentry-webhook":
        return new SentryWebhookHandler(mq, store);
      case "plane-sentry-webhook":
        return new SentryPlaneWebhookHandler(mq, store);
      case "flatfile":
        return new FlatfileMigrator(mq, store);
      case "clickup":
        return new ClickUpDataMigrator(mq, store);
      case "clickup_additional_data":
        return new ClickUpAdditionalDataMigrator(mq, store);
      default:
        throw new Error(`Unsupported worker type: ${type}`);
    }
  }
}

/**
 * Configuration interface for job worker settings
 * @interface JobWorkerConfig
 */
interface JobWorkerConfig {
  /** Mapping of worker types to their implementations */
  workerTypes: { [key: string]: string };
  /** Number of retry attempts for failed tasks */
  retryAttempts: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay: number;
}

/**
 * Union type for different task properties
 * @typedef {Object} TaskProps
 */
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

/**
 * Main task management class that handles worker lifecycle and task distribution
 * @class TaskManager
 */
export class TaskManager {
  private mq: MQ | undefined;
  private store: Store | undefined;
  private config: JobWorkerConfig;
  private workers: Map<string, TaskHandler> = new Map();

  /**
   * Creates an instance of TaskManager
   * @param {JobWorkerConfig} config - Configuration for the task manager
   */
  constructor(config: JobWorkerConfig) {
    this.config = config;

    process.on("SIGINT", this.cleanup.bind(this));
    process.on("SIGTERM", this.cleanup.bind(this));
    process.on("exit", this.cleanup.bind(this));
  }

  async healthCheck() {
    if (!this.mq) {
      throw new Error("Message Queue not initialized");
    }
    return this.mq.healthCheck();
  }

  /**
   * Initializes the message queue connection
   * @private
   * @param {TMQEntityOptions} options - Queue configuration options
   */
  private initQueue = async (options: TMQEntityOptions) => {
    this.mq = new MQ(options);
    await this.mq.connect();
    logger.info(`Message Queue ${options.queueName} connected successfully 🐇🐇🐰`);
  };

  /**
   * Initializes the store connection
   * @private
   * @param {string} name - Name of the store instance
   */
  private initStore = async () => {
    this.store = Store.getInstance();
  };

  /**
   * Cleanup handler for process termination
   * @private
   */
  private cleanup = async () => {
    if (this.store) {
      await this.store.clean();
    }
  };

  /**
   * Starts the message consumer and sets up event listeners
   * @private
   */
  private startConsumer = async () => {
    if (!this.mq || !this.store) return;
    this.store.addListener("ready", (data) => {
      const props: TaskProps = {
        type: "store",
        event: data,
      };

      this.handleTask(props);
    });

    await this.mq.startConsuming(async (msg: any) => {
      const startTime = Date.now();
      try {
        await this.handleTaskWithTimeout(msg);
      } catch (error) {
        logger.error("Error processing message:", error);
        return;
      } finally {
        const processingTime = Date.now() - startTime;
        logger.info(`Message processed in ${processingTime}ms`);
        await this.mq?.ackMessage(msg);
      }
    });
  };

  /**
   * Wrap the task execution in a timeout to ensure the message is acknowledged within the consumer timeout
   * @param msg - The message to handle
   * @returns void
   */
  private async handleTaskWithTimeout(msg: any) {
    if (!this.mq) return;

    // Create a promise that resolves when the task completes
    const data = JSON.parse(msg.content.toString());
    const headers = msg.properties.headers;
    // logger.info("Received message:", headers);
    const props: TaskProps = {
      type: "mq",
      headers: headers.headers,
      data: data,
    };
    const taskPromise = this.handleTask(props);

    // Create a timeout promise that resolves after 15 minutes
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        logger.warn("Task execution timed out after the consumer timeout", { headers: headers?.headers });
        resolve();
      }, MQ_CONSUMER_TIMEOUT);
    });

    // Race between task completion and timeout
    await Promise.race([taskPromise, timeoutPromise]);
  }

  /**
   * Handles incoming tasks from both MQ and store events
   * @private
   * @param {TaskProps} props - Task properties and data
   */
  private async handleTask(props: TaskProps) {
    if (props.type === "store") {
      // Validate the event received
      const chunks = props.event.split(":");
      // For Issues: silo:{worker}:{type}:{action}:{entity}
      // For Comments: silo:{worker}:{type}:{action}:{entity}

      if (chunks.length >= 5 && chunks[0] === "silo") {
        const worker = this.workers.get(chunks[1]);
        if (!worker) {
          return;
        }
        const headers: TaskHeaders = {
          route: chunks[1],
          type: chunks[2],
          jobId: chunks[3],
        };

        const entity = chunks.slice(4).join(":");
        // Create a lock with 5 minute TTL since event processing should be quick
        const lockKey = `silo:lock:${entity}`;
        const lock = new Lock(this.store!, {
          type: "custom",
          lockKey: lockKey,
          ttl: 15, // 15 seconds TTL
        });

        // Try to acquire the lock - Redis SETNX ensures atomic operation
        const acquired = await lock.acquireLock("lock");
        if (!acquired) {
          // Another container is processing this event, skip
          return;
        }

        try {
          const data = JSON.parse(entity);

          await new Promise((resolve) => setTimeout(resolve, Math.random() * 200));
          await worker.handleTask(headers, data);
        } finally {
          // Release the lock after processing
          await lock.releaseLock();
        }
      }
    } else {
      const worker = this.workers.get(props.headers.route);
      if (!worker) {
        return;
      }
      await worker.handleTask(props.headers, props.data);
    }
  }

  /**
   * Starts the task manager and initializes all required connections
   * @public
   * @param {TMQEntityOptions} options - Queue configuration options
   */
  public start = async (options: TMQEntityOptions) => {
    try {
      await this.initQueue(options);
      await this.initStore();
      await this.startConsumer();

      for (const [jobType, workerType] of Object.entries(this.config.workerTypes)) {
        this.workers.set(jobType, WorkerFactory.createWorker(workerType, this.mq!, this.store!));
      }
    } catch (error) {
      logger.error(`Something went wrong while initiating job worker 🧨, ${error}`);
      captureException(error as Error);
    }
  };

  /**
   * Registers a new task for processing
   * @public
   * @param {TaskHeaders} headers - Task headers containing routing information
   * @param {any} data - Task data to be processed
   */
  public registerTask = async (headers: TaskHeaders, data: any) => {
    if (!this.mq) return;
    try {
      await this.mq.sendMessage(data, { headers });
    } catch (error) {
      logger.error("Error pushing to job worker queue:", error);
      captureException(error as Error);
    }
  };

  /**
   * Registers a new task for processing in the store
   * @public
   * @param {TaskHeaders} headers - Task headers containing routing information
   * @param {any} data - Task data to be processed
   * @param {number} [ttl] - Time to live for the task in the store
   */
  public registerStoreTask = async (headers: TaskHeaders, data: any, ttl?: number) => {
    if (!this.store) return;
    try {
      const key = `silo:${headers.route}:${headers.type}:${headers.jobId}:${JSON.stringify(data)}`;

      await this.store.set(key, "1", ttl, false);
    } catch (error) {
      logger.error("Error pushing to job worker queue:", error);
      captureException(error as Error);
    }
  };
}

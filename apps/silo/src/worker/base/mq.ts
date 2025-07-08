import amqp from "amqplib";
import { env } from "@/env";
import { captureException, logger } from "@/logger";
import { TMQEntityOptions } from "./types";

export class MQActorBase {
  private connection!: amqp.Connection;
  exchange: string;
  queueName: string;
  routingKey: string;
  channel!: amqp.Channel;
  amqpUrl = env.AMQP_URL || "amqp://localhost";
  private reconnecting = false;
  private readonly RECONNECT_INTERVAL = 5000;
  private isConnected = false;
  private consumerCallback?: (data: any) => void;

  constructor(options: TMQEntityOptions, amqpUrl?: string) {
    this.exchange = "migration_exchange";

    if (amqpUrl) {
      this.amqpUrl = amqpUrl;
    }

    if (options.appType === "extension") {
      this.exchange = options.exchange ?? "migration_exchange";
      this.queueName = options.queueName;
      this.routingKey = options.routingKey;
    } else {
      if (options.appType === "integration-tasks") {
        this.queueName = options.queueName;
        this.routingKey = options.routingKey;
      } else {
        this.queueName = "silo-api";
        this.routingKey = "silo-api";
      }
    }
  }

  setConsumerCallback(callback: (data: any) => void) {
    this.consumerCallback = callback;
  }

  async healthCheck() {
    // Test the connection by checking if channel is open
    logger.info("[RabbitMQ] Health check started", {
      isConnected: this.isConnected,
    });
    try {
      if (!this.channel) {
        throw new Error("Channel is not initialized");
      }

      // Try a simple operation to test the connection
      await this.channel.checkQueue(this.queueName);
      return true;
    } catch (error) {
      logger.error("[RabbitMQ] Health check failed:", error);
      throw error;
    }
  }

  private async setupConnectionListeners() {
    this.connection.on("error", (error) => {
      this.isConnected = false;
      logger.error("[RabbitMQ] Connection error:", error);
      this.handleReconnection();
    });

    this.connection.on("close", (error) => {
      this.isConnected = false;
      logger.error("[RabbitMQ] Connection closed:", error);
      this.handleReconnection();
    });

    this.connection.on("blocked", (reason) => {
      logger.error("[RabbitMQ] Connection blocked:", reason);
    });

    this.connection.on("unblocked", () => {
      logger.info("[RabbitMQ] Connection unblocked");
    });

    this.channel.on("close", () => {
      logger.error("[RabbitMQ] Channel closed");
      this.handleReconnection();
    });

    this.channel.on("error", (error) => {
      logger.error("[RabbitMQ] Channel error:", error);
      this.handleReconnection();
    });
  }

  private async handleReconnection() {
    if (this.reconnecting) return;

    this.reconnecting = true;
    let attemptCount = 0;

    while (true) {
      try {
        attemptCount++;
        await this.initializeConnection();

        if (this.consumerCallback) {
          await this.reRegisterConsumer();
        }

        this.reconnecting = false;
        logger.info("[RabbitMQ] Successfully reconnected and re-registered consumer");
        return true;
      } catch (error) {
        if (attemptCount % 10 === 0) {
          logger.error(`[MQ] RabbitMQ reconnection attempt ${attemptCount} failed`, { error });
          captureException(new Error(`[MQ] RabbitMQ reconnection attempt ${attemptCount} failed`));
          process.exit(1);
        }
        await new Promise((resolve) => setTimeout(resolve, this.RECONNECT_INTERVAL));
        logger.info(`Attempting to reconnect to RabbitMQ [${attemptCount}]...`);
      }
    }
  }

  private async reRegisterConsumer() {
    if (!this.consumerCallback) return;

    try {
      await this.channel.consume(
        this.queueName,
        (msg: any) => {
          if (msg && msg.content) {
            this.consumerCallback!(msg);
          }
        },
        {
          noAck: false,
        }
      );
      logger.info("[RabbitMQ] Consumer re-registered successfully");
    } catch (error) {
      logger.error("[RabbitMQ] Failed to re-register consumer:", error);
      throw error;
    }
  }

  private async initializeConnection() {
    try {
      // Clean up existing connection if it exists
      if (this.connection) {
        try {
          await this.connection.close();
        } catch (error) {
          // Ignore errors when closing existing connection
          logger.warn("[RabbitMQ] Error closing existing connection:", error);
        }
      }

      this.connection = await amqp.connect(this.amqpUrl, {
        heartbeat: 30, // 30 seconds - more frequent alerts
      });

      this.channel = await this.connection.createConfirmChannel();
      await this.setupConnectionListeners();
      await this.setupQueuesAndExchanges();
      this.isConnected = true;
      logger.info("[RabbitMQ] Connection initialized successfully");
    } catch (error) {
      this.isConnected = false;
      logger.error("[RabbitMQ] Failed to initialize connection:", error);
      throw error;
    }
  }

  async connect() {
    let attemptCount = 0;
    while (true) {
      try {
        attemptCount++;
        await this.initializeConnection();
        return;
      } catch {
        if (attemptCount % 10 === 0) {
          logger.info(`[MQ] RabbitMQ initial connection attempt ${attemptCount} failed`);
          captureException(new Error(`[MQ] RabbitMQ initial connection attempt ${attemptCount} failed`));
        }
        await new Promise((resolve) => setTimeout(resolve, this.RECONNECT_INTERVAL));
        logger.info(`Attempting to reconnect to RabbitMQ [${attemptCount}]...`);
      }
    }
  }

  private async setupQueuesAndExchanges() {
    if (this.queueName !== "celery") {
      const dlxExchange = `dlx_exchange`;
      const dlxQueue = `${this.queueName}.dlx`;
      const dlxRoutingKey = `dlx_routing_key`;

      await this.channel.assertExchange(dlxExchange, "direct", {
        durable: true,
      });

      await this.channel.assertQueue(dlxQueue, {
        durable: true,
        arguments: {},
      });

      await this.channel.bindQueue(dlxQueue, dlxExchange, dlxRoutingKey);

      await this.channel.assertQueue(this.queueName, {
        durable: true,
        arguments: {
          "x-dead-letter-exchange": dlxExchange,
          "x-dead-letter-routing-key": dlxRoutingKey,
        },
      });
    } else {
      await this.channel.assertQueue(this.queueName, {
        durable: true,
      });
    }

    await this.channel.assertExchange(this.exchange, "direct", {
      durable: true,
    });

    await this.channel.bindQueue(this.queueName, this.exchange, this.routingKey);
  }

  async close() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}

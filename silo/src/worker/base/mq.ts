import amqp from "amqplib";
import { env } from "@/env";
import { SentryInstance } from "@/sentry-config";
import { TMQEntityOptions } from "./types";

export class MQActorBase {
  private connection!: amqp.Connection;
  exchange: string;
  queueName: string;
  routingKey: string;
  channel!: amqp.Channel;
  amqpUrl = env.AMQP_URL || "amqp://localhost";
  private reconnecting = false;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_INTERVAL = 5000;

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

  private async setupConnectionListeners() {
    this.connection.on("error", (err) => {
      this.handleReconnection();
    });

    this.connection.on("close", () => {
      this.handleReconnection();
    });

    this.channel.on("error", (err) => {
      this.handleReconnection();
    });

    this.channel.on("close", () => {
      this.handleReconnection();
    });
  }

  private async handleReconnection() {
    if (this.reconnecting) return;

    this.reconnecting = true;
    while (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      try {
        console.log(`Reconnection attempt ${this.reconnectAttempts + 1}/${this.MAX_RECONNECT_ATTEMPTS}`);
        await this.connect();
        this.reconnecting = false;
        this.reconnectAttempts = 0;
        console.log("Successfully reconnected to RabbitMQ");
        return true;
      } catch (error) {
        this.reconnectAttempts++;
        console.error(`Reconnection attempt failed:`, error);
        await new Promise((resolve) => setTimeout(resolve, this.RECONNECT_INTERVAL));
      }
    }

    SentryInstance.captureException(new Error("Not able to reconnect to rabbit mq. Aborting..."));
  }

  async connect() {
    try {
      // Create connection
      this.connection = await amqp.connect(this.amqpUrl, {
        heartbeat: 60,
      });

      // Create confirm channel
      this.channel = await this.connection.createConfirmChannel();

      // Setup connection and channel event listeners
      await this.setupConnectionListeners();

      // Setup queues and exchanges
      await this.setupQueuesAndExchanges();
    } catch (error) {
      throw new Error(`Failed to connect to RabbitMQ: ${error}`);
    }
  }

  private async setupQueuesAndExchanges() {
    try {
      // Declare the Dead Letter Exchange and Queue
      if (this.queueName !== "celery") {
        const dlxExchange = `dlx_exchange`;
        const dlxQueue = `${this.queueName}.dlx`;
        const dlxRoutingKey = `dlx_routing_key`;

        // Setup DLX
        await this.channel.assertExchange(dlxExchange, "direct", {
          durable: true,
        });

        await this.channel.assertQueue(dlxQueue, {
          durable: true,
          arguments: {},
        });

        await this.channel.bindQueue(dlxQueue, dlxExchange, dlxRoutingKey);

        // Setup main queue with DLX configuration
        await this.channel.assertQueue(this.queueName, {
          durable: true,
          arguments: {
            "x-dead-letter-exchange": dlxExchange,
            "x-dead-letter-routing-key": dlxRoutingKey,
          },
        });
      } else {
        // Setup celery queue without DLX
        await this.channel.assertQueue(this.queueName, {
          durable: true,
        });
      }

      // Setup main exchange
      await this.channel.assertExchange(this.exchange, "direct", {
        durable: true,
      });

      // Bind queue to exchange
      await this.channel.bindQueue(this.queueName, this.exchange, this.routingKey);
    } catch (error) {
      console.error("Error setting up queues and exchanges:", error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log("RabbitMQ connection closed successfully");
    } catch (error) {
      console.error("Error while closing RabbitMQ connection:", error);
      throw error;
    }
  }
}

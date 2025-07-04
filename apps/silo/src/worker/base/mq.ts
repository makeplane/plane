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
    this.connection.on("error", () => {
      this.handleReconnection();
    });

    this.connection.on("close", () => {
      this.handleReconnection();
    });

    this.channel.on("error", () => {
      this.handleReconnection();
    });

    this.channel.on("close", () => {
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
        this.reconnecting = false;
        return true;
      } catch {
        if (attemptCount % 10 === 0) {
          logger.info(`[MQ] RabbitMQ reconnection attempt ${attemptCount} failed`);
          captureException(new Error(`[MQ] RabbitMQ reconnection attempt ${attemptCount} failed`));
        }
        await new Promise((resolve) => setTimeout(resolve, this.RECONNECT_INTERVAL));
        logger.info(`Attempting to reconnect to RabbitMQ [${attemptCount}]...`);
      }
    }
  }

  private async initializeConnection() {
    this.connection = await amqp.connect(this.amqpUrl, {
      heartbeat: 5 * 60, // 5 minutes - suitable for long-running operations
    });

    this.channel = await this.connection.createConfirmChannel();
    await this.setupConnectionListeners();
    await this.setupQueuesAndExchanges();
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

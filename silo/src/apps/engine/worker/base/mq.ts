import amqp from "amqplib";
import { TMQEntityOptions } from "./types";
import { env } from "@/env";
import { logger } from "@/logger";

export class MQActorBase {
  private connection!: amqp.Connection;
  exchange: string;
  queueName: string;
  routingKey: string;
  channel!: amqp.Channel;
  amqpUrl = env.AMQP_URL || "amqp://localhost";

  private dlxQueueSettings = {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "dlx_exchange",
      "x-dead-letter-routing-key": "dlx_routing_key",
    },
  };

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

  async connect() {
    try {
      this.connection = await amqp.connect(this.amqpUrl);
      this.channel = await this.connection.createConfirmChannel();

      const queueInfo = await this.channel.checkQueue(this.queueName);

      if (!queueInfo) {
        // Declare the Dead Letter Exchange and Queue
        if (this.queueName !== "celery") {
          await this.channel.assertExchange("dlx_exchange", "direct", { durable: true });
          await this.channel.assertQueue("dlx_queue", this.dlxQueueSettings);
          await this.channel.bindQueue("dlx_queue", "dlx_exchange", "dlx_routing_key");
          await this.channel.assertQueue(this.queueName, { durable: true });
        }
      }

      await this.channel.assertExchange(this.exchange, "direct", {
        durable: true,
      });
      await this.channel.bindQueue(this.queueName, this.exchange, this.routingKey);
    } catch (error) {
      throw new Error("Error while connecting to RabbitMq: " + error);
    }
  }

  async close() {
    try {
      await this.channel.close();
      await this.connection.close();
    } catch (error) {
      console.log("Error while closing RabbitMq connection", error);
    }
  }
}

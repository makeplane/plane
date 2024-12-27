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

  constructor(options: TMQEntityOptions, amqpUrl?: string) {
    this.exchange = "migration_exchange";

    if (amqpUrl) {
      this.amqpUrl = amqpUrl;
    }

    if (options.appType === "extension") {
      this.exchange = options.exchange ?? "migration_exchange";
    }

    if (options.appType === "integration-tasks") {
      this.queueName = options.queueName;
      this.routingKey = options.routingKey;
    } else {
      this.queueName = "silo-api";
      this.routingKey = "silo-api";
    }
  }

  async connect() {
    try {
      // create connection
      const amqpUrl = this.amqpUrl;

      this.connection = await amqp.connect(amqpUrl, {});
      this.channel = await this.connection.createConfirmChannel();

      // Declare the Dead Letter Exchange and Queue
      if (this.queueName !== "celery") {
        const dlxExchange = "dlx_exchange";
        const dlxQueue = "dlx_queue";

        await this.channel.assertExchange(dlxExchange, "direct", {
          durable: true,
        });
        await this.channel.assertQueue(dlxQueue, { durable: true });
        await this.channel.bindQueue(dlxQueue, dlxExchange, "dlx_routing_key");

        await this.channel.assertQueue(this.queueName, {
          durable: true,
          arguments: {
            "x-dead-letter-exchange": dlxExchange,
            "x-dead-letter-routing-key": "dlx_routing_key",
          },
        });
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

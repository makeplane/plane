import { env } from "@/env";
import { MQConsumer } from "./consumer";
import { MQProducer } from "./producer";
import { TMQEntityOptions } from "./types";
import { logger } from "@/logger";

// An encapsulation of RabbitMQ producer and consumer
export class MQ {
  private producer: MQProducer;
  private consumer: MQConsumer;

  constructor(options: TMQEntityOptions, amqpUrl?: string) {
    this.producer = new MQProducer(options, amqpUrl);
    this.consumer = new MQConsumer(options, amqpUrl);
  }

  async connect() {
    try {
      await this.producer.connect();
      await this.consumer.connect();
    } catch (error) {
      throw new Error("Error while connecting to RabbitMq: " + error);
    }
  }

  async sendMessage(data: any, headers: any, routingKey?: string) {
    await this.producer.sendMessage(data, headers, routingKey);
  }

  async startConsuming(callback: (data: any) => void) {
    const prefetchCount = Number(env.MQ_PREFETCH_COUNT) ?? 5;
    this.consumer.channel.prefetch(prefetchCount);
    await this.consumer.startConsuming(callback);
  }

  async close() {
    try {
      await this.consumer.close();
      await this.producer.close();
    } catch (error) {
      logger.error("Error while closing RabbitMq connection", error);
    }
  }

  async ackMessage(msg: any) {
    this.consumer.channel.ack(msg);
  }

  async nackMessage(msg: any) {
    this.consumer.channel.nack(msg);
  }
}

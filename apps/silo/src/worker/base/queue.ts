import { env } from "@/env";
import { logger } from "@/logger";
import { MQConsumer } from "./consumer";
import { MQProducer } from "./producer";
import { TMQEntityOptions } from "./types";

// An encapsulation of RabbitMQ producer and consumer
export class MQ {
  private producer: MQProducer;
  private consumer: MQConsumer;
  private consumerCallback?: (data: any) => void;

  constructor(options: TMQEntityOptions, amqpUrl?: string) {
    this.producer = new MQProducer(options, amqpUrl);
    this.consumer = new MQConsumer(options, amqpUrl);
  }

  async connect() {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      logger.info("[MQ] Both producer and consumer connected successfully");
    } catch (error) {
      logger.error("[MQ] Error while connecting to RabbitMQ:", error);
      throw new Error("Error while connecting to RabbitMq: " + error);
    }
  }

  async sendMessage(data: any, headers: any, routingKey?: string) {
    try {
      await this.producer.sendMessage(data, headers, routingKey);
    } catch (error) {
      logger.error("[MQ] Error sending message:", error);
      throw error;
    }
  }

  async startConsuming(callback: (data: any) => void) {
    try {
      this.consumerCallback = callback;
      const prefetchCount = Number(env.MQ_PREFETCH_COUNT) ?? 5;
      this.consumer.channel.prefetch(prefetchCount);
      await this.consumer.startConsuming(callback);
      logger.info("[MQ] Consumer started successfully");
    } catch (error) {
      logger.error("[MQ] Error starting consumer:", error);
      throw error;
    }
  }

  async close() {
    try {
      await this.consumer.close();
      await this.producer.close();
      logger.info("[MQ] Both producer and consumer closed successfully");
    } catch (error) {
      logger.error("Error while closing RabbitMq connection", { error });
      throw error;
    }
  }

  async ackMessage(msg: any) {
    try {
      this.consumer.channel.ack(msg);
    } catch (error) {
      logger.error("[MQ] Error acknowledging message:", error);
      throw error;
    }
  }

  async nackMessage(msg: any) {
    try {
      this.consumer.channel.nack(msg);
    } catch (error) {
      logger.error("[MQ] Error negative acknowledging message:", error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      const consumerHealth = await this.consumer.healthCheck();

      // Both producer and consumer must be healthy
      if (!consumerHealth) {
        throw new Error("One or both MQ components are unhealthy");
      }

      return true;
    } catch (error) {
      logger.error("[MQ] Health check failed:", error);
      throw error;
    }
  }
}

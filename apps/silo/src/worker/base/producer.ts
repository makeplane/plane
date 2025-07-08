import { MQActorBase } from "./mq";

export class MQProducer extends MQActorBase {
  async sendMessage(data: any, headers: any, routingKey?: string) {
    try {
      routingKey = routingKey || this.routingKey;
      this.channel.publish(this.exchange, routingKey, Buffer.from(JSON.stringify(data)), {
        headers,
        contentType: "application/json",
        contentEncoding: "utf-8",
        deliveryMode: 2,
      });
    } catch (error) {
      throw new Error(`Failed to send message: ${error}`, { cause: error });
    }
  }

  async cancelConsumer(consumer: { consumerTag: string }) {
    await this.channel.cancel(consumer.consumerTag);
  }
}

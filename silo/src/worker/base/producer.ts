import { MQActorBase } from "./mq";

export class MQProducer extends MQActorBase {
  async sendMessage(data: any, headers: any, routingKey?: string) {
    routingKey = routingKey || this.routingKey;
    this.channel.publish(this.exchange, routingKey, Buffer.from(JSON.stringify(data)), {
      headers,
      contentType: "application/json",
      contentEncoding: "utf-8",
      deliveryMode: 2,
    });
  }

  async cancelConsumer(consumer: { consumerTag: string }) {
    await this.channel.cancel(consumer.consumerTag);
  }
}

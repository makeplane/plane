import { MQActorBase } from "./mq"

export class MQProducer extends MQActorBase {
  async sendMessage(data: any, headers: any, routingKey?: string) {
    routingKey = routingKey || this.routingKey
    this.channel.publish(this.exchange, routingKey, Buffer.from(JSON.stringify(data)), {
      headers,
      persistent: false,
      mandatory: false
    })
  }

  async cancelConsumer(consumer: { consumerTag: string }) {
    await this.channel.cancel(consumer.consumerTag)
  }
}

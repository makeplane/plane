import { MQActorBase } from "./mq";

export class MQConsumer extends MQActorBase {
  startConsuming(callback: (data: any) => void) {
    // Store the callback for re-registration during reconnection
    this.setConsumerCallback(callback);

    return this.channel.consume(
      this.queueName,
      (msg: any) => {
        if (msg && msg.content) {
          callback(msg);
        }
      },
      {
        noAck: false,
      }
    );
  }

  async cancelConsumer(consumer: { consumerTag: string }) {
    await this.channel.cancel(consumer.consumerTag);
  }
}

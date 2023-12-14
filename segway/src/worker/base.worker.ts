// mq
import { ConsumeMessage } from "amqplib";
// mq single ton
import { MQSingleton } from "../queue/mq.singleton";
// logger
import { logger } from "../utils/logger";

export abstract class BaseWorker {
  mq: MQSingleton | null = null;

  protected routingKey: string;

  constructor(
    protected queueName: string,
    routingKey: string
  ) {
    this.mq = MQSingleton.getInstance();
    this.routingKey = routingKey;
    this.onMessage = this.onMessage.bind(this);
  }

  public async start(): Promise<void> {
    try {
      this.mq?.consume(this.queueName, this.onMessage);
    } catch (error) {
      logger.error("Error starting workers");
    }
  }

  protected async publish(queueName: string, content: Buffer): Promise<void> {
    try {
      this.mq?.sendToQueue(queueName, content);
    } catch (error) {
      logger.error("Error sending to queue");
    }
  }

  protected abstract onMessage(msg: ConsumeMessage | null): void;

  protected isRelevantMessage(msg: ConsumeMessage): boolean {
    console.log(msg)
    // Check if the message's routing key matches this worker's routing key
    const messageRoutingKey = msg.properties.headers["routingKey"];
    return messageRoutingKey === this.routingKey;
  }
}

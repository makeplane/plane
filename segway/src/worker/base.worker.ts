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

  // Start the consumer
  public async start(): Promise<void> {
    try {
      this.mq?.consume(this.queueName, this.onMessage);
    } catch (error) {
      logger.error("Error starting workers");
    }
  }

  // Publish this to queue
  protected async publish(body: object, taskName: string): Promise<void> {
    try {
      this.mq?.publish(body, taskName);
    } catch (error) {
      logger.error("Error sending to queue");
    }
  }

  protected abstract onMessage(msg: ConsumeMessage | null): void;

}

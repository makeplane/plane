// mq
import { ConsumeMessage } from "amqplib";
// mq single ton
import { MQSingleton } from "../queue/mq.singleton";
// logger
import { logger } from "../utils/logger";

export abstract class BaseWorker {
  mq: MQSingleton | null = null;

  constructor(protected queueName: string) {
    this.mq = MQSingleton.getInstance();
  }

  public async start(): Promise<void> {
    try {
      this.mq?.consume(this.queueName, this.onMessage);
    } catch (error) {
      logger.error("Error starting workers");
    }
  }

  protected abstract onMessage(msg: ConsumeMessage | null): void;
}

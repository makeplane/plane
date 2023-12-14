// mq
import { ConsumeMessage } from "amqplib";
// base worker
import { BaseWorker } from "./base.worker";

export class JiraImportWorker extends BaseWorker {
  constructor() {
    super("django_to_node_queue", "django.node");
  }

  protected onMessage(msg: ConsumeMessage | null): void {
    try {
      // Process Jira message
      console.log(msg);

      this.publish(
        "node_to_celery_queue",
        Buffer.from(JSON.stringify(""))
      );
    } catch (error) {
      console.log(error);
    }
  }
}

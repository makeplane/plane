// mq
import { ConsumeMessage } from "amqplib";
// base worker
import { BaseWorker } from "./base.worker";

export class GithubImportWorker extends BaseWorker {
  constructor() {
    super("importer", "github");
  }

  protected onMessage(msg: ConsumeMessage | null): void {
    if (msg && this.isRelevantMessage(msg)) {
      // Process Jira message
      const data = JSON.parse(msg.content.toString());
      const jsonString = JSON.stringify(data);
      const buffer = Buffer.from(jsonString, "utf-8");
      this.publish("importer", buffer);
    }
  }
}

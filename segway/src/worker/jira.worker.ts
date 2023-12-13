//
import { ConsumeMessage } from "amqplib";
// base worker
import { BaseWorker } from "./base.worker";

export class JiraImportWorker extends BaseWorker {
  constructor() {
    super("importer", "jira");
  }

  protected onMessage(msg: ConsumeMessage | null): void {
    if (msg && this.isRelevantMessage(msg)) {
      // Process Jira message
      const data = JSON.parse(msg.content.toString())
      console.log(data)
    }
  }
}

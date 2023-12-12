//
import { ConsumeMessage } from "amqplib";
// base worker
import { BaseWorker } from "./base.worker";

export class JiraImportWorker extends BaseWorker {
  constructor() {
    super("importer");
  }

  protected onMessage(msg: ConsumeMessage | null): void {}
}

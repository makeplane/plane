import { MQ, Store } from "@/apps/engine/worker/base";
import { TaskHandler, TaskHeaders } from "@/types";
import { PlaneWebhookData, WebhookIssueCommentPayload } from "@plane/sdk";
import { handleIssueCommentWebhook } from "./plane-webhook-handlers/handle-comment-webhook";

export class PlaneSlackWebhookWorker extends TaskHandler {
  mq: MQ;
  store: Store;

  constructor(mq: MQ, store: Store) {
    super();
    this.mq = mq;
    this.store = store;
  }
  async handleTask(headers: TaskHeaders, data: PlaneWebhookData): Promise<boolean> {
    switch (data.event) {
      case "issue_comment":
        handleIssueCommentWebhook(data as WebhookIssueCommentPayload);
        break;
      default:
        break;
    }

    return true;
  }
}

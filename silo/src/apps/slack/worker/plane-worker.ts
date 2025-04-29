import { MQ, Store } from "@/worker/base";
import { TaskHandler, TaskHeaders } from "@/types";
import { PlaneWebhookPayload, WebhookIssueCommentPayload } from "@plane/sdk";
import { handleIssueCommentWebhook } from "./plane-webhook-handlers/handle-comment-webhook";
import { logger } from "@/logger";
import { handleIssueWebhook } from "./plane-webhook-handlers/handle-issue-webhook";

export class PlaneSlackWebhookWorker extends TaskHandler {
  mq: MQ;
  store: Store;

  constructor(mq: MQ, store: Store) {
    super();
    this.mq = mq;
    this.store = store;
  }
  async handleTask(headers: TaskHeaders, data: any): Promise<boolean> {
    try {
      switch (data.event) {
        case "issue":
          await handleIssueWebhook(data as PlaneWebhookPayload);
          break
        case "issue_comment":
          await handleIssueCommentWebhook(data as WebhookIssueCommentPayload);
          break;
        default:
          break;
      }
    } catch (error) {
      logger.error(error);
    } finally {
      logger.info("[SLACK] Event Processed Successfully");
      return true;
    }
  }
}

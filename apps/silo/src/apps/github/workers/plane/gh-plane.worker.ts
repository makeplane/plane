import { PlaneWebhookPayload } from "@plane/sdk";
import { logger } from "@/logger";
import { TaskHandler, TaskHeaders } from "@/types";
import { MQ, Store } from "@/worker/base";
import { handleIssueCommentWebhook } from "./event-handlers/issue-comment.handler";
import { handleIssueWebhook } from "./event-handlers/issue.handler";
export class PlaneGithubWebhookWorker extends TaskHandler {
  mq: MQ;
  store: Store;

  constructor(mq: MQ, store: Store) {
    super();
    this.mq = mq;
    this.store = store;
  }
  async handleTask(headers: TaskHeaders, data: PlaneWebhookPayload): Promise<boolean> {
    try {
      switch (data.event) {
        case "issue":
          await handleIssueWebhook(headers, this.mq, this.store, data);
          break;
        case "issue_comment":
          await handleIssueCommentWebhook(headers, this.mq, this.store, data);
          break;
        default:
          break;
      }
    } catch (error) {
      logger.error("[GITHUB] Error processing plane webhook:", error);
    } finally {
      return true;
    }
  }
}

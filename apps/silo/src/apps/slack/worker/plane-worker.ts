import { MQ, Store } from "@/worker/base";
import { TaskHandler, TaskHeaders } from "@/types";
import { PlaneWebhookPayload, WebhookIssueCommentPayload } from "@plane/sdk";
import { handleIssueCommentWebhook } from "./plane-webhook-handlers/handle-comment-webhook";
import { logger } from "@/logger";
import { handleIssueWebhook } from "./plane-webhook-handlers/handle-issue-webhook";
import { handleProjectUpdateWebhook } from "./plane-webhook-handlers/handle-project-updates";

export class PlaneSlackWebhookWorker extends TaskHandler {
  mq: MQ;
  store: Store;

  constructor(mq: MQ, store: Store) {
    super();
    this.mq = mq;
    this.store = store;
  }
  async handleTask(headers: TaskHeaders, data: any): Promise<boolean> {

    logger.info(`[SLACK] [PLANE_WORKER] Received payload`, {
      payload: {
        headers,
        data,
      },
    });

    try {
      switch (data.event) {
        case "issue":
          await handleIssueWebhook(data as PlaneWebhookPayload);
          break;
        case "issue_comment":
          await handleIssueCommentWebhook(data as WebhookIssueCommentPayload);
          break;
        case "project_update":
          await handleProjectUpdateWebhook(data as PlaneWebhookPayload);
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

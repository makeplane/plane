import { logger } from "@plane/logger";
import { PlaneWebhookPayload } from "@plane/sdk";
import { captureException } from "@/logger";
import { TaskHandler, TaskHeaders } from "@/types";
import { MQ, Store } from "@/worker/base";
import { E_SLACK_WORKER_EVENTS } from "../types/types";
import { handleIssueCommentWebhook } from "./plane-webhook-handlers/handle-comment-webhook";
import { handleDMAlertWebhook } from "./plane-webhook-handlers/handle-dm-alerts";
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
  async handleTask(headers: TaskHeaders, data: PlaneWebhookPayload): Promise<boolean> {
    logger.info(`[SLACK] [PLANE_WORKER] Received payload`, {
      payload: {
        headers,
        data,
      },
    });

    try {
      switch (data.event) {
        case E_SLACK_WORKER_EVENTS.ISSUE:
          await handleIssueWebhook(data);
          break;
        case E_SLACK_WORKER_EVENTS.ISSUE_COMMENT:
          await handleIssueCommentWebhook(data);
          break;
        case E_SLACK_WORKER_EVENTS.PROJECT_UPDATE:
          await handleProjectUpdateWebhook(data);
          break;
        case E_SLACK_WORKER_EVENTS.DM_ALERT:
          await handleDMAlertWebhook(data);
          break;
        default:
          break;
      }
    } catch (error) {
      logger.error(error);
      captureException(error as Error);
    } finally {
      logger.info("[SLACK] Event Processed Successfully");
      return true;
    }
  }
}

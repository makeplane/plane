import { MQ, Store } from "@/worker/base";
import { logger } from "@/logger";
import { TaskHandler, TaskHeaders } from "@/types";
import { GitlabMergeRequestEvent, GitlabWebhookEvent } from "@plane/etl/gitlab";
import { handleMergeRequest } from "./handlers/merge-request.handler";
import { SentryInstance } from "@/sentry-config";

export class GitlabWebhookWorker extends TaskHandler {
  mq: MQ;
  store: Store;

  constructor(mq: MQ, store: Store) {
    super();
    this.mq = mq;
    this.store = store;
  }
  async handleTask(headers: TaskHeaders, data: GitlabWebhookEvent): Promise<boolean> {
    logger.info(
      `[GITLAB][${headers.type.toUpperCase()}] Received webhook event from gitlab 🐱 --------- [${data.event_type}]`
    );

    try {
      if (data.event_type === "merge_request") {
        await handleMergeRequest(data as GitlabMergeRequestEvent);
      }
    } catch (error) {
      SentryInstance.captureException(error); 
    } finally {
      logger.info("[GITLAB] Event Processed Successfully");
      return true;
    }
  }
}

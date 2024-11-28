import { MQ, Store } from "@/apps/engine/worker/base";
import { logger } from "@/logger";
import { TaskHandler, TaskHeaders } from "@/types";
import { GitlabMergeRequestEvent, GitlabWebhookEvent } from "@silo/gitlab";
import { handleMergeRequest } from "./handlers/merge-request.handler";

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

    if (data.event_type === "merge_request") {
      await handleMergeRequest(data as GitlabMergeRequestEvent);
    }

    return true;
  }
}

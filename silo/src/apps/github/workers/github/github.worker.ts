import { MQ, Store } from "@/apps/engine/worker/base";
import { logger } from "@/logger";
import { TaskHandler, TaskHeaders } from "@/types";
import { GithubWebhookPayload } from "@silo/github";
import { handleInstallationEvents } from "./event-handlers/installation.handler";
import { handleIssueComment } from "./event-handlers/issue-comment.handler";
import { handleIssueEvents } from "./event-handlers/issue.handler";
import { handlePullRequestEvents } from "./event-handlers/pull-request.handler";

export class GithubWebhookWorker extends TaskHandler {
  mq: MQ;
  store: Store;

  constructor(mq: MQ, store: Store) {
    super();
    this.mq = mq;
    this.store = store;
  }
  async handleTask(headers: TaskHeaders, data: any): Promise<boolean> {
    data = data as GithubWebhookPayload;
    const eventType = headers.type;

    logger.info(
      `[GITHUB][${headers.type.toUpperCase()}] Received webhook event from github 🐱 --------- [${headers.route.toUpperCase()}]`
    );

    switch (eventType) {
      case "installation": {
        return handleInstallationEvents(data.action, data);
      }
      case "issues": {
        return handleIssueEvents(this.store, data.action, data);
      }
      case "pull_request": {
        return handlePullRequestEvents(data.action, data);
      }
      case "issue_comment": {
        return handleIssueComment(this.store, data.action, data);
      }
      default: {
      }
    }

    return true;
  }
}

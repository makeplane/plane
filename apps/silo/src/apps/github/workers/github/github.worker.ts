import { GithubWebhookPayload } from "@plane/etl/github";
import { CONSTANTS } from "@/helpers/constants";
import { captureException, logger } from "@/logger";
import { TaskHandler, TaskHeaders } from "@/types";
import { MQ, Store } from "@/worker/base";
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
    try {
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
      }
    } catch (error: any) {
      // Silently skip events where we don't have permission to process
      if (error?.detail && error?.detail.includes(CONSTANTS.NO_PERMISSION_ERROR)) {
        logger.info(`[GITHUB] No permission to process event: ${error.detail} ${data}`);
        return false;
      }
      captureException(error);
    } finally {
      logger.info("[GITHUB] Event Processed Successfully");
      return true;
    }
  }
}

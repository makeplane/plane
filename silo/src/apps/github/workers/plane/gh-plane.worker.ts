import { MQ, Store } from "@/apps/engine/worker/base";
import { TaskHandler, TaskHeaders } from "@/types";
import { PlaneWebhookPayload } from "@plane/sdk";
import { handleIssueWebhook } from "./event-handlers/issue.handler";
import { handleIssueCommentWebhook } from "./event-handlers/issue-comment.handler";

export class PlaneGithubWebhookWorker extends TaskHandler {
  mq: MQ;
  store: Store;

  constructor(mq: MQ, store: Store) {
    super();
    this.mq = mq;
    this.store = store;
  }
  async handleTask(headers: TaskHeaders, data: PlaneWebhookPayload): Promise<boolean> {
    switch (data.event) {
      case "issue":
        handleIssueWebhook(headers, this.mq, this.store, data);
        break;
      case "issue_comment":
        handleIssueCommentWebhook(headers, this.mq, this.store, data);
        break;
      default:
        break;
    }

    return true;
  }
}

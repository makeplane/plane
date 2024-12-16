import { logger } from "@/logger";
import { TaskHandler, TaskHeaders } from "@/types";
import { TSlackPayload } from "@silo/slack";
import { handleMessageAction } from "./handlers/message-action";
import { handleBlockActions } from "./handlers/block-actions";
import { MQ, Store } from "@/apps/engine/worker/base";
import { handleViewSubmission } from "./handlers/view-submission";
import { handleMessageEvent } from "./handlers/handle-message";

export class SlackInteractionHandler extends TaskHandler {
  mq: MQ;
  store: Store;

  constructor(mq: MQ, store: Store) {
    super();
    this.mq = mq;
    this.store = store;
  }

  async handleTask(headers: TaskHeaders, data: TSlackPayload): Promise<boolean> {
    logger.info(
      `[SLACK][${headers.type.toUpperCase()}] Received webhook event from slack 🐱 --------- [${headers.route}]`
    );

    switch (data.type) {
      case "message_action":
        await handleMessageAction(data);
        break;
      case "block_actions":
        await handleBlockActions(data);
        break;
      case "view_submission":
        await handleViewSubmission(data);
        break;
      case "view_closed":
        break;
      case "message":
        await handleMessageEvent(data);
        break;
      default:
        break;
    }

    return true;
  }
}

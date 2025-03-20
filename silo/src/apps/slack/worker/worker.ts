import { TSlackPayload } from "@plane/etl/slack";
import { logger } from "@/logger";
import { SentryInstance } from "@/sentry-config";
import { TaskHandler, TaskHeaders } from "@/types";
import { MQ, Store } from "@/worker/base";
import { handleBlockActions } from "./handlers/block-actions";
import { handleCommand } from "./handlers/handle-command";
import { handleSlackEvent } from "./handlers/handle-message";
import { handleMessageAction } from "./handlers/message-action";
import { handleViewSubmission } from "./handlers/view-submission";

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

    try {
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
        case "event":
          await handleSlackEvent(data);
          break;
        case "command":
          await handleCommand(data);
          break;
        default:
          break;
      }
    } catch (error) {
      SentryInstance.captureException(error);
      logger.error(error);
    } finally {
      logger.info("[SLACK] Event Processed Successfully");
      return true;
    }
  }
}

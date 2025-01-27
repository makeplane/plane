import { logger } from "@/logger";
import { TaskHandler, TaskHeaders } from "@/types";
import { TSlackPayload } from "@plane/etl/slack";
import { handleMessageAction } from "./handlers/message-action";
import { handleBlockActions } from "./handlers/block-actions";
import { MQ, Store } from "@/apps/engine/worker/base";
import { handleViewSubmission } from "./handlers/view-submission";
import { handleSlackEvent } from "./handlers/handle-message";
import { handleCommand } from "./handlers/handle-command";
import { SentryInstance } from "@/sentry-config";

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
        case "view_closed":
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

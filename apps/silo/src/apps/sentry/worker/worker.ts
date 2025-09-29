import { SentryWebhookPayload } from "@plane/etl/sentry";
import { logger } from "@plane/logger";
import { PlaneWebhookPayload } from "@plane/sdk";
import { TaskHandler, TaskHeaders } from "@/types";
import { MQ, Store } from "@/worker/base";
import { ESentryWebhookType, ISentryTaskHandler } from "../types";
import { SentryIssueHandler, SentryAlertHandler, SentryInstallationHandler, PlaneIssueHandler } from "./handlers";

export class SentryWebhookHandler extends TaskHandler {
  mq: MQ;
  store: Store;

  handlers: Map<ESentryWebhookType, ISentryTaskHandler> = new Map<ESentryWebhookType, ISentryTaskHandler>([
    [ESentryWebhookType.ISSUE, new SentryIssueHandler()],
    [ESentryWebhookType.EVENT_ALERT, new SentryAlertHandler()],
    [ESentryWebhookType.INSTALLATION, new SentryInstallationHandler()],
  ]);

  constructor(mq: MQ, store: Store) {
    super();
    this.mq = mq;
    this.store = store;
  }

  async handleTask(headers: TaskHeaders, data: SentryWebhookPayload): Promise<boolean> {
    logger.info(`[SENTRY][${headers.type}] Received webhook event from sentry 🐱 --------- [${headers.route}]`);

    const handler = this.handlers.get(headers.type as ESentryWebhookType);

    try {
      await handler?.handle(this.store, data);
      return true;
    } catch (error) {
      logger.error(`[SENTRY] Error processing webhook: ${error}`, { error, data });
      return false;
    }
  }
}

export class SentryPlaneWebhookHandler extends TaskHandler {
  mq: MQ;
  store: Store;

  constructor(mq: MQ, store: Store) {
    super();
    this.mq = mq;
    this.store = store;
  }

  async handleTask(headers: TaskHeaders, data: PlaneWebhookPayload): Promise<boolean> {
    logger.info(
      `[SENTRY][${headers.type}] Received webhook event from plane for sentry 🐱 --------- [${headers.route}]`
    );
    try {
      if (headers.type === "issue") {
        const handler = new PlaneIssueHandler();
        await handler.handle(this.store, data);
      } else {
        logger.info(`[SENTRY] Unsupported webhook type: ${headers.type}`);
      }

      return true;
    } catch (error) {
      logger.error(`[SENTRY] Error processing webhook: ${error}`, { error, data });
      return false;
    }
  }
}

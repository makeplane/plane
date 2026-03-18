/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { logger } from "@plane/logger";
import type { PlaneWebhookPayload } from "@plane/sdk";
import { captureException } from "@/logger";
import type { TaskHeaders } from "@/types";
import { TaskHandler } from "@/types";
import type { MQ, Store } from "@/worker/base";
import { handleIssueWebhook } from "./event-handlers/issue.handler";

export class PlaneBitbucketWebhookWorker extends TaskHandler {
  mq: MQ;
  store: Store;

  constructor(mq: MQ, store: Store) {
    super();
    this.mq = mq;
    this.store = store;
  }

  // eslint-disable-next-line require-await -- handleTask must be async per TaskHandler interface
  async handleTask(_headers: TaskHeaders, data: PlaneWebhookPayload): Promise<boolean> {
    try {
      logger.info(`[BITBUCKET] [PLANE_WORKER] Received payload for event: ${data.event}`);

      switch (data.event) {
        case "issue":
          handleIssueWebhook(data);
          break;
        // TODO: Enable issue comment sync once ready
        // case "issue_comment":
        //   await handleIssueComment(this.store, data);
        //   break;
        default:
          break;
      }

      return true;
    } catch (error) {
      logger.error("[BITBUCKET] Error processing Plane webhook", error);
      captureException(error as Error);
      return true;
    }
  }
}

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

import type { BitbucketPullRequestWebhookAction } from "@plane/etl/bitbucket";
import { logger } from "@plane/logger";
import { CONSTANTS } from "@/helpers/constants";
import { captureException } from "@/logger";
import type { TaskHeaders } from "@/types";
import { TaskHandler } from "@/types";
import type { MQ, Store } from "@/worker/base";
import { handlePullRequestEvents } from "./event-handlers/pull-request.handler";

const BITBUCKET_PR_EVENTS: BitbucketPullRequestWebhookAction[] = [
  "pr:opened",
  "pr:merged",
  "pr:declined",
  "pr:deleted",
  "pr:modified",
];

const extractErrorDetail = (error: unknown): string | undefined => {
  if (typeof error !== "object" || error === null || !("detail" in error)) {
    return undefined;
  }

  const detail = error.detail;
  return typeof detail === "string" ? detail : undefined;
};

export class BitbucketWebhookWorker extends TaskHandler {
  mq: MQ;
  store: Store;

  constructor(mq: MQ, store: Store) {
    super();
    this.mq = mq;
    this.store = store;
  }

  async handleTask(headers: TaskHeaders, data: unknown): Promise<boolean> {
    // For store-originated tasks (dedup'd PR events), headers.type is sanitized (colons replaced
    // with underscores) to be compatible with the Redis key format. The original Bitbucket event
    // type (e.g. "pr:modified") is preserved in data.action, so we prefer that as the source of truth.
    const payload = data as Record<string, unknown>;
    const eventType = typeof payload?.action === "string" ? payload.action : headers.type;

    try {
      let result = true;

      if (BITBUCKET_PR_EVENTS.includes(eventType as BitbucketPullRequestWebhookAction)) {
        result = await handlePullRequestEvents(eventType as BitbucketPullRequestWebhookAction, data);
        logger.info("[BITBUCKET] Pull request webhook event processed", { eventType });
        return result;
      }

      // TODO: Enable PR comment sync once ready
      // import { handlePRCommentEvents } from "./event-handlers/pr-comment.handler";
      // const BITBUCKET_PR_COMMENT_EVENTS = ["pr:comment:added", "pr:comment:edited", "pr:comment:deleted"];
      // if (BITBUCKET_PR_COMMENT_EVENTS.includes(eventType)) {
      //   result = await handlePRCommentEvents(this.store, eventType, data);
      // }

      logger.info("[BITBUCKET] Webhook event ignored as unsupported type", { eventType });
      return result;
    } catch (error: unknown) {
      const detail = extractErrorDetail(error);
      if (detail?.includes(CONSTANTS.NO_PERMISSION_ERROR)) {
        logger.info(`[BITBUCKET] No permission to process event: ${detail}`);
        return false;
      }

      logger.error("[BITBUCKET] Error processing webhook event", {
        eventType,
        error,
      });
      captureException(error instanceof Error ? error : new Error("Unknown Bitbucket webhook worker error"));
      return true;
    }
  }
}

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
import type { TaskHeaders } from "@/types";
import { TaskHandler } from "@/types";
import type { MQ, Store } from "@/worker/base";
import { agentRegistry } from "@/agents";
import type { AgentWebhookPayload } from "@/agents/core";

export class AgentWebhookWorker extends TaskHandler {
  mq: MQ;
  store: Store;

  constructor(mq: MQ, store: Store) {
    super();
    this.mq = mq;
    this.store = store;
  }

  async handleTask(headers: TaskHeaders, data: AgentWebhookPayload): Promise<boolean> {
    const agentKey = headers.type;
    logger.info(`[AgentWebhookWorker] Processing webhook for agent: ${agentKey}`);

    const agent = agentRegistry.get(agentKey);
    if (!agent) {
      logger.error(`[AgentWebhookWorker] Agent not found: ${agentKey}`);
      return false;
    }

    try {
      await agent.handleWebhook(data);
      return true;
    } catch (error) {
      logger.error(`[AgentWebhookWorker] Error processing agent webhook`, { error, agentKey });
      return false;
    }
  }
}

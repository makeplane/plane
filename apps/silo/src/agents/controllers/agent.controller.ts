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

import { randomUUID } from "crypto";
import type { Request, Response } from "express";
import { Controller, Post } from "@plane/decorators";
import { logger } from "@plane/logger";
import { responseHandler } from "@/helpers/response-handler";
import { integrationTaskManager } from "@/worker/index";
import { agentRegistry } from "@/agents";

const HANDLED_EVENTS = ["agent_run_user_prompt"];

interface AgentWebhookBody {
  event?: string;
  data?: unknown;
}

@Controller("/api/agents")
export class AgentController {
  @Post("/webhook/:agentKey")
  async handlePlaneWebhook(req: Request, res: Response) {
    try {
      const { agentKey } = req.params;
      const payload = req.body as AgentWebhookBody;

      // Only handle agent_run_user_prompt events
      if (!payload.event || !HANDLED_EVENTS.includes(payload.event)) {
        return res.status(200).json({ message: "Webhook event not handled" });
      }

      // Verify agent exists in registry
      if (!agentRegistry.has(agentKey)) {
        return responseHandler(res, 404, `Agent ${agentKey} not found`);
      }

      // Queue the inner data payload for async processing
      await integrationTaskManager.registerTask(
        { route: "agent-webhook", jobId: randomUUID(), type: agentKey },
        payload.data
      );

      return res.status(202).json({ message: "Webhook queued" });
    } catch (error) {
      logger.error("[AgentController] Error handling webhook", { error });
      return responseHandler(res, 500, error);
    }
  }
}

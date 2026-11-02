/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Hocuspocus } from "@hocuspocus/server";
import type { Request, Response } from "express";
import { z } from "zod";
// plane imports
import { Controller, Post } from "@plane/decorators";
import { logger } from "@plane/logger";
// env
import { env } from "@/env";
// extensions
import { Redis } from "@/extensions/redis";

const issueEventSchema = z.object({
  project_id: z.string().min(1, "project_id is required"),
  issue_id: z.string().nullish(),
  type: z.string().nullish(),
  actor_id: z.string().nullish(),
});

@Controller("/broadcasts")
export class BroadcastController {
  [key: string]: unknown;
  private readonly hocuspocusServer: Hocuspocus;

  constructor(hocuspocusServer: Hocuspocus) {
    this.hocuspocusServer = hocuspocusServer;
  }

  @Post("/issue-events")
  async broadcastIssueEvent(req: Request, res: Response) {
    // verify the internal api key for server-to-server calls
    const internalApiKey = req.headers["x-internal-api-key"];
    if (!env.LIVE_INTERNAL_API_KEY || internalApiKey !== env.LIVE_INTERNAL_API_KEY) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // validate request body
    const parsedBody = issueEventSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        message: "project_id is required",
      });
    }

    const { project_id, issue_id, type, actor_id } = parsedBody.data;
    const documentName = `issue-events:${project_id}`;
    const payload = JSON.stringify({
      event: "issue_changed",
      data: {
        project_id,
        issue_id: issue_id ?? null,
        type: type ?? null,
        actor_id: actor_id ?? null,
      },
    });

    const redisExtension = this.hocuspocusServer.configuration.extensions.find((ext) => ext instanceof Redis);
    if (!redisExtension) {
      logger.error("BROADCAST_CONTROLLER: Redis extension not found");
      return res.status(500).json({
        message: "Broadcast infrastructure unavailable",
      });
    }

    try {
      const receivers = await redisExtension.broadcastToDocument(documentName, payload);
      return res.status(200).json({
        message: "Broadcasted",
        receivers,
      });
    } catch (error) {
      logger.error(`BROADCAST_CONTROLLER: Error broadcasting to ${documentName}:`, error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
}

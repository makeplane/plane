/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Request, Response } from "express";
import { Controller, Get, Middleware } from "@plane/decorators";
import { env } from "@/env";
import { collectStats, requireStatsAccess } from "@/events/stats";

@Controller("/health")
export class HealthController {
  @Get("/")
  async healthCheck(_req: Request, res: Response) {
    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      version: env.APP_VERSION,
    });
  }

  // Operational counters since start. Kept off the public /health: it needs the live shared secret header.
  @Get("/stats")
  @Middleware(requireStatsAccess)
  async stats(_req: Request, res: Response) {
    res.status(200).json(collectStats());
  }
}

/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import cors from "cors";
import express, { type Express, type Request, type Response } from "express";
import helmet from "helmet";

import { config } from "./config";
import { callDjango } from "./django-client";
import { notificationsRouter } from "./notifications";
import { slackChannelsRouter } from "./slack/channels";
import { slackCommandsRouter } from "./slack/commands";
import { slackEventsRouter } from "./slack/events";
import { slackInteractionsRouter } from "./slack/interactions";
import { slackOAuthRouter } from "./slack/oauth";
import { slackUserOAuthRouter } from "./slack/user-oauth";

export function createApp(): Express {
  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: (process.env.SILO_CORS_ORIGINS ?? "http://localhost:3000,http://localhost:3001")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      credentials: false,
    })
  );
  // Slack webhook routes need the raw body for HMAC verification. The
  // per-route `express.raw()` middleware in slack/{commands,interactions,events}.ts
  // can only see a Buffer if the body hasn't been consumed yet — so
  // skip the global JSON parser on those paths. Each Slack route
  // handler installs its own raw parser scoped to its content-type.
  const SLACK_RAW_PATHS = new Set([
    `${config.basePath}/api/slack/commands`,
    `${config.basePath}/api/slack/interactions`,
    `${config.basePath}/api/slack/events`,
    `${config.basePath}/api/notifications/work-item-event`,
  ]);
  const jsonParser = express.json({ limit: "5mb" });
  app.use((req, res, next) => {
    if (SLACK_RAW_PATHS.has(req.path)) return next();
    return jsonParser(req, res, next);
  });

  const router = express.Router();

  router.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, service: "silo", version: "0.1.0" });
  });

  router.get("/django-ping", async (_req: Request, res: Response) => {
    try {
      const r = await callDjango("GET", "/api/v1/silo/ping/");
      res.status(r.status).json({ status: r.status, data: r.data });
    } catch (err) {
      res.status(502).json({ error: (err as Error).message });
    }
  });

  router.use(slackOAuthRouter());
  router.use(slackUserOAuthRouter());
  router.use(slackCommandsRouter());
  router.use(slackInteractionsRouter());
  router.use(slackEventsRouter());
  router.use(slackChannelsRouter());
  router.use(notificationsRouter());

  app.use(config.basePath, router);
  return app;
}

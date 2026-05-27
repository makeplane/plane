/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Slack slash command webhook (`/plane`).
 *   POST /silo/api/slack/commands
 *
 * Slack sends `application/x-www-form-urlencoded`. We need the raw
 * body for HMAC verification before parsing, so this router installs
 * `express.raw()` instead of relying on the global JSON parser.
 *
 * Slack expects a 200 response within 3 seconds. We ack immediately
 * and open the "Create work item" modal asynchronously via
 * `views.open` using the `trigger_id` from the payload (valid 3s).
 */

import type { Request, Response, Router } from "express";
import express from "express";

import { getSlackConfig } from "../config";
import { callSlackApiForTeam } from "./api";
import { buildCreateWorkItemView } from "./modal";
import { verifySlackSignature } from "./signature";
import { resolveTeamContext } from "./team-context";

type SlashPayload = Record<string, string>;

const parseForm = (raw: Buffer): SlashPayload => {
  const params = new URLSearchParams(raw.toString("utf8"));
  const out: SlashPayload = {};
  for (const [k, v] of params) out[k] = v;
  return out;
};

const openCreateWorkItemModal = async (payload: SlashPayload): Promise<void> => {
  const teamId = payload.team_id ?? "";
  const triggerId = payload.trigger_id ?? "";
  const channelId = payload.channel_id ?? "";
  const userId = payload.user_id ?? "";
  const text = (payload.text ?? "").trim();

  if (!teamId || !triggerId) {
    console.warn("[silo] /plane payload missing team_id or trigger_id");
    return;
  }

  let ctx;
  try {
    ctx = await resolveTeamContext(teamId);
  } catch (err) {
    console.error(`[silo] team-context lookup failed:`, (err as Error).message);
    return;
  }
  if (!ctx) {
    console.warn(`[silo] no Plane workspace bound to Slack team ${teamId}`);
    return;
  }

  const view = buildCreateWorkItemView(
    ctx.projects,
    {
      workspaceSlug: ctx.workspaceSlug,
      channelId,
      triggerUserId: userId,
      installerUserId: ctx.installerUserId,
    },
    text
  );

  const result = await callSlackApiForTeam("views.open", teamId, {
    trigger_id: triggerId,
    view,
  });
  if (!result || !result.ok) {
    console.error(`[silo] views.open failed: ${result?.error ?? "no-team-context"} (team=${teamId})`);
  }
};

export const slackCommandsRouter = (): Router => {
  const r = express.Router();

  r.post(
    "/api/slack/commands",
    express.raw({ type: "application/x-www-form-urlencoded", limit: "1mb" }),
    (req: Request, res: Response) => {
      const slack = getSlackConfig();
      const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
      const ts = req.header("x-slack-request-timestamp") ?? undefined;
      const sig = req.header("x-slack-signature") ?? undefined;

      const verdict = verifySlackSignature(slack.signingSecret, rawBody, ts, sig);
      if (!verdict.ok) {
        res.status(verdict.status).type("text/plain").send(verdict.reason);
        return;
      }

      const payload = parseForm(rawBody);
      // Ack immediately so Slack doesn't see us blow the 3s budget.
      res.status(200).end();

      openCreateWorkItemModal(payload).catch((err: unknown) => {
        console.error("[silo] /plane handler crashed:", err);
      });
    }
  );

  return r;
};

/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Slack Events API webhook.
 *   POST /silo/api/slack/events
 *
 * Slack sends `application/json` for events. Three top-level types:
 *
 *   1. `url_verification` — one-time challenge when the Request URL
 *      is set in the Slack app config. We must echo back `challenge`
 *      within 3 seconds, signed-or-not (Slack does not sign the
 *      verification request consistently — it does send the headers
 *      from the registered signing secret, so we still verify).
 *
 *   2. `event_callback` with inner `event.type` we care about:
 *        - `link_shared` — Plane URL pasted in a channel; respond
 *          with `chat.unfurl` to render a card.
 *        - `app_mention` — @Plane in a thread; v1 ack-only stub
 *          (logged). The AI agent lands later.
 *        - `message` (in `message.channels`/`message.groups`
 *          subscriptions) — ack-only stub, foundation for thread
 *          sync.
 *
 *   3. Anything else — log and 200 so Slack doesn't retry.
 *
 * Slack expects 200 within 3s on every dispatch. Heavy work
 * (chat.unfurl) runs async after the ack.
 */

import type { Request, Response, Router } from "express";
import express from "express";

import { getSlackConfig } from "../config";
import { callDjango } from "../django-client";
import { callSlackApiForTeam } from "./api";
import { verifySlackSignature } from "./signature";
import { resolveTeamContext } from "./team-context";

type SlackUrlVerification = {
  type: "url_verification";
  challenge: string;
  token?: string;
};

type SlackEventLink = { url: string; domain: string };

type SlackEventCallback = {
  type: "event_callback";
  team_id: string;
  event: {
    type: string;
    user?: string;
    channel?: string;
    message_ts?: string;
    links?: SlackEventLink[];
    text?: string;
    [k: string]: unknown;
  };
};

type SlackEvent = SlackUrlVerification | SlackEventCallback | { type: string };

// Match Plane work-item URLs:
//   http(s)://<host>/<workspace-slug>/projects/<uuid>/issues/<uuid>
// Host is intentionally not pinned — Slack already filters to the
// app domains we register in the Slack app config (`link_shared`
// only fires on subscribed domains), so anything that reaches us
// is by definition a Plane host.
const WORK_ITEM_URL_RE = /^https?:\/\/[^/]+\/([^/]+)\/projects\/([0-9a-f-]{36})\/issues\/([0-9a-f-]{36})/i;

type ParsedWorkItemUrl = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

const parseWorkItemUrl = (url: string): ParsedWorkItemUrl | null => {
  const m = WORK_ITEM_URL_RE.exec(url);
  if (!m) return null;
  return { workspaceSlug: m[1], projectId: m[2], issueId: m[3] };
};

type WorkItemLookup = {
  id: string;
  sequence_id: number;
  name: string;
  project_identifier: string;
  state_name: string | null;
  state_group: string | null;
  priority: string | null;
  workspace_slug: string;
  project_id: string;
};

const lookupWorkItem = async (parsed: ParsedWorkItemUrl): Promise<WorkItemLookup | null> => {
  const r = await callDjango<WorkItemLookup>("POST", "/api/v1/silo/work-items/lookup/", {
    workspace_slug: parsed.workspaceSlug,
    project_id: parsed.projectId,
    issue_id: parsed.issueId,
  });
  if (r.status === 404) return null;
  if (r.status >= 300) {
    console.error(`[silo] work-item lookup failed: ${r.status} ${JSON.stringify(r.data)}`);
    return null;
  }
  return r.data;
};

const buildUnfurlBlocks = (item: WorkItemLookup, webBaseUrl: string): Record<string, unknown> => {
  const ref = `${item.project_identifier}-${item.sequence_id}`;
  const stateLine =
    item.state_name && item.state_group ? `*${item.state_name}* · ${item.state_group}` : (item.state_name ?? "");
  const fields: string[] = [];
  if (stateLine) fields.push(stateLine);
  if (item.priority && item.priority !== "none") {
    fields.push(`Priority: *${item.priority}*`);
  }
  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*<${webBaseUrl}/${item.workspace_slug}/projects/${item.project_id}/issues/${item.id}|${ref}: ${item.name}>*`,
        },
      },
      ...(fields.length > 0
        ? [
            {
              type: "context",
              elements: fields.map((t) => ({ type: "mrkdwn", text: t })),
            },
          ]
        : []),
    ],
  };
};

const handleLinkShared = async (payload: SlackEventCallback, webBaseUrl: string): Promise<void> => {
  const teamId = payload.team_id;
  const channel = payload.event.channel;
  const messageTs = payload.event.message_ts;
  const links = payload.event.links ?? [];
  if (!teamId || !channel || !messageTs || links.length === 0) return;

  const ctx = await resolveTeamContext(teamId);
  if (!ctx) {
    console.warn(`[silo] link_shared for unknown team=${teamId}`);
    return;
  }

  // Look up every Plane URL in parallel — they're independent.
  const lookups = await Promise.all(
    links.map(async (link) => {
      const parsed = parseWorkItemUrl(link.url);
      if (!parsed) return null;
      const item = await lookupWorkItem(parsed);
      if (!item) return null;
      return { url: link.url, blocks: buildUnfurlBlocks(item, webBaseUrl) };
    })
  );
  const unfurls: Record<string, Record<string, unknown>> = {};
  for (const r of lookups) {
    if (r) unfurls[r.url] = r.blocks;
  }
  if (Object.keys(unfurls).length === 0) return;

  const result = await callSlackApiForTeam("chat.unfurl", teamId, {
    channel,
    ts: messageTs,
    unfurls,
  });
  if (!result || !result.ok) {
    console.error(`[silo] chat.unfurl failed: ${result?.error ?? "no-team-context"} (team=${teamId})`);
  }
};

const dispatchEvent = (payload: SlackEventCallback): void => {
  const eventType = payload.event.type;
  // Unfurl card links land in Slack messages — public URL only.
  const webBaseUrl = process.env.PLANE_PUBLIC_URL ?? process.env.WEB_BASE_URL ?? "http://localhost:3000";

  switch (eventType) {
    case "link_shared":
      void handleLinkShared(payload, webBaseUrl).catch((err) => {
        console.error("[silo] link_shared handler crashed:", err);
      });
      return;
    case "app_mention":
      // v1 stub — AI agent lives in Phase 6.
      console.log(
        `[silo] app_mention from team=${payload.team_id} user=${payload.event.user ?? "?"} text=${JSON.stringify(payload.event.text ?? "")}`
      );
      return;
    case "message":
      // v1 stub — thread-sync foundation.
      return;
    default:
      console.log(`[silo] unhandled event type: ${eventType}`);
  }
};

export const slackEventsRouter = (): Router => {
  const r = express.Router();

  r.post(
    "/api/slack/events",
    express.raw({ type: "application/json", limit: "5mb" }),
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

      let payload: SlackEvent;
      try {
        payload = JSON.parse(rawBody.toString("utf8"));
      } catch {
        res.status(400).type("text/plain").send("invalid json");
        return;
      }

      if (payload.type === "url_verification") {
        res.status(200).json({ challenge: (payload as SlackUrlVerification).challenge });
        return;
      }

      // Ack first; do work async.
      res.status(200).end();

      if (payload.type === "event_callback") {
        try {
          dispatchEvent(payload as SlackEventCallback);
        } catch (err) {
          console.error("[silo] dispatchEvent crashed:", err);
        }
      }
    }
  );

  return r;
};

/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Inbound: Plane Django → silo, work-item lifecycle events fanned
 * out to subscribed channels (and, in later phases, DMs).
 *
 *   POST /silo/api/notifications/work-item-event
 *
 * Authenticated via the same silo↔Django HMAC scheme used in the
 * other direction. Django signs with the shared
 * SILO_HMAC_SECRET_KEY; we verify here.
 *
 * Payload shape — see plane/bgtasks/silo_notification_task.py.
 *
 * For now we only handle the Slack `slack-channel-notification`
 * mappings; the per-user DM path (assignment, mention) is a
 * follow-up that requires a different lookup (WorkspaceUserConnection
 * → bot DM) and is queued behind this.
 */

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import type { Request, Response, Router } from "express";
import express from "express";

import { config } from "./config";
import { callDjango } from "./django-client";
import { callSlackApiForTeam } from "./slack/api";

const NOTIFICATION_PATH = "/api/notifications/work-item-event";
const HMAC_SKEW_SECONDS = 5 * 60;

type IssuePayload = {
  id: string;
  sequence_id: number;
  name: string;
  state_name: string | null;
  state_group: string | null;
  priority: string | null;
};

type ActorPayload = {
  id: string;
  display_name: string;
  email: string;
};

type StateChangePayload = {
  from_name: string | null;
  from_group: string | null;
  to_name: string | null;
  to_group: string | null;
};

type DmTarget = {
  plane_user_id: string;
  slack_user_id: string;
};

type WorkItemEvent = {
  event_type: "work_item.created" | "work_item.state_changed" | "work_item.commented" | "work_item.completed";
  activity_type: string;
  workspace_slug: string;
  workspace_id: string;
  project_id: string;
  project_identifier: string;
  issue: IssuePayload | null;
  actor: ActorPayload | null;
  comment_text: string | null;
  state_change: StateChangePayload | null;
  dm_targets: DmTarget[];
};

type ProjectMapping = {
  id: string;
  workspace_connection_id: string;
  connection_type: string;
  connection_team_id: string;
  project_id: string | null;
  type: string;
  entity_type: string;
  entity_id: string;
  entity_slug: string | null;
  config: { events?: string[] } | null;
};

const verifyDjangoHmac = (
  rawBody: Buffer,
  method: string,
  pathFromDjango: string,
  ts: string | undefined,
  sig: string | undefined
): { ok: true } | { ok: false; status: number; reason: string } => {
  if (!ts || !sig) return { ok: false, status: 401, reason: "missing signature headers" };
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return { ok: false, status: 401, reason: "bad timestamp" };
  if (Math.abs(Math.floor(Date.now() / 1000) - tsNum) > HMAC_SKEW_SECONDS) {
    return { ok: false, status: 401, reason: "timestamp skew too large" };
  }
  const bodyHash = createHash("sha256").update(rawBody).digest("hex");
  const msg = `${ts}.${method.toUpperCase()}.${pathFromDjango}.${bodyHash}`;
  const expected = createHmac("sha256", config.hmacSecret).update(msg).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, status: 403, reason: "invalid signature" };
  }
  return { ok: true };
};

const buildBlocks = (event: WorkItemEvent, webBaseUrl: string): Record<string, unknown>[] => {
  const issue = event.issue;
  if (!issue)
    return [{ type: "section", text: { type: "mrkdwn", text: `_(no issue payload for ${event.event_type})_` } }];

  const ref = `${event.project_identifier}-${issue.sequence_id}`;
  const url = `${webBaseUrl}/${event.workspace_slug}/projects/${event.project_id}/issues/${issue.id}`;
  const actorName = event.actor?.display_name ?? event.actor?.email ?? "someone";

  const sc = event.state_change;
  const stateTransition = sc && sc.from_name && sc.to_name ? `${sc.from_name} → *${sc.to_name}*` : null;

  let leadText = "";
  switch (event.event_type) {
    case "work_item.created":
      leadText = `*${actorName}* created *<${url}|${ref}: ${issue.name}>*`;
      break;
    case "work_item.state_changed":
      leadText = stateTransition
        ? `*${actorName}* moved *<${url}|${ref}: ${issue.name}>* — ${stateTransition}`
        : `*${actorName}* updated *<${url}|${ref}: ${issue.name}>*`;
      break;
    case "work_item.commented":
      leadText = `*${actorName}* commented on *<${url}|${ref}: ${issue.name}>*`;
      break;
    case "work_item.completed": {
      const verb = sc?.to_group === "cancelled" ? "cancelled" : "completed";
      leadText = `*${actorName}* ${verb} *<${url}|${ref}: ${issue.name}>* — ${sc?.to_name ?? issue.state_name ?? ""}`;
      break;
    }
  }

  const blocks: Record<string, unknown>[] = [{ type: "section", text: { type: "mrkdwn", text: leadText } }];

  if (event.event_type === "work_item.commented" && event.comment_text) {
    const trimmed = event.comment_text.length > 600 ? `${event.comment_text.slice(0, 600)}…` : event.comment_text;
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `> ${trimmed.replace(/\n/g, "\n> ")}` },
    });
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Reply" },
          action_id: "plane_reply_comment",
          value: JSON.stringify({
            workspace_slug: event.workspace_slug,
            project_id: event.project_id,
            issue_id: issue.id,
            project_identifier: event.project_identifier,
            sequence_id: issue.sequence_id,
            issue_name: issue.name,
          }),
        },
        {
          type: "button",
          text: { type: "plain_text", text: "View in Plane" },
          url,
        },
      ],
    });
  }

  const ctx: string[] = [];
  if (issue.state_name) ctx.push(issue.state_name);
  if (issue.priority && issue.priority !== "none") ctx.push(`priority: ${issue.priority}`);
  if (ctx.length > 0) {
    blocks.push({
      type: "context",
      elements: ctx.map((t) => ({ type: "mrkdwn", text: t })),
    });
  }
  return blocks;
};

const fetchSlackChannelMappings = async (workspaceSlug: string, projectId: string): Promise<ProjectMapping[]> => {
  const r = await callDjango<{ mappings: ProjectMapping[] }>("POST", "/api/v1/silo/project-mappings/", {
    workspace_slug: workspaceSlug,
    project_id: projectId,
    type: "slack-channel-notification",
  });
  if (r.status >= 300) {
    throw new Error(`project-mappings fetch failed: ${r.status} ${JSON.stringify(r.data)}`);
  }
  return (r.data.mappings ?? []).filter((m) => m.connection_type === "slack");
};

const dispatch = async (event: WorkItemEvent, webBaseUrl: string): Promise<void> => {
  const blocks = buildBlocks(event, webBaseUrl);
  const fallbackText = `${event.project_identifier}-${event.issue?.sequence_id ?? "?"}: ${event.issue?.name ?? ""}`;

  console.log(
    `[silo] dispatch event=${event.event_type} ws=${event.workspace_slug} project=${event.project_id} dm_targets=${event.dm_targets.length}`
  );

  // 1. Channel fan-out for project-bound mappings.
  const mappings = await fetchSlackChannelMappings(event.workspace_slug, event.project_id);
  console.log(`[silo] dispatch channel mappings=${mappings.length}`);

  // teamId is needed for DMs too; reuse the mappings' team_id when
  // present (any mapping carries the workspace's Slack team), but
  // fall back to looking up workspace-connections via Django if not.
  let teamId: string | null = mappings[0]?.connection_team_id ?? null;

  // Channel fan-out runs in parallel. Slack's per-bot postMessage rate
  // limit is 1/sec/channel and ~50/sec total for chat.postMessage —
  // we'd hit that fanning out to dozens of channels for one event,
  // not for one event to 2-3 channels. Slack returns 429 with
  // Retry-After if we ever do; the SDK doesn't auto-retry today
  // (TODO if/when we have hot channels).
  const eligibleMappings = mappings.filter(
    (m) => (m.config?.events ?? []).length === 0 || (m.config?.events ?? []).includes(event.event_type)
  );
  await Promise.all(
    eligibleMappings.map(async (m) => {
      const result = await callSlackApiForTeam("chat.postMessage", m.connection_team_id, {
        channel: m.entity_id,
        blocks,
        text: fallbackText,
        unfurl_links: false,
        unfurl_media: false,
      });
      if (!result || !result.ok) {
        console.error(`[silo] chat.postMessage to ${m.entity_id} failed: ${result?.error ?? "no-team-context"}`);
      }
    })
  );

  // 2. Per-user DMs (assignment / mention).
  if (event.dm_targets.length > 0 && !teamId) {
    // No project channel mappings, so we don't have a team_id from
    // them. Look up the workspace's Slack install location via Django.
    teamId = await fetchSlackTeamIdForWorkspace(event.workspace_slug);
  }
  if (event.dm_targets.length > 0 && teamId) {
    const dmTeamId = teamId;
    // DMs run in parallel — one user per request, no shared rate-limit
    // bucket between users on chat.postMessage.
    await Promise.all(
      event.dm_targets.map(async (dm) => {
        console.log(`[silo] DM attempt slack_user=${dm.slack_user_id}`);
        const opened = await callSlackApiForTeam<{
          ok: boolean;
          error?: string;
          channel?: { id: string };
        }>("conversations.open", dmTeamId, { users: dm.slack_user_id });
        if (!opened || !opened.ok || !opened.channel?.id) {
          console.error(
            `[silo] conversations.open for ${dm.slack_user_id} failed: ${opened?.error ?? "no-team-context"}`
          );
          return;
        }
        console.log(`[silo] DM channel opened: ${opened.channel.id}`);
        const r = await callSlackApiForTeam("chat.postMessage", dmTeamId, {
          channel: opened.channel.id,
          blocks,
          text: fallbackText,
          unfurl_links: false,
          unfurl_media: false,
        });
        if (!r || !r.ok) {
          console.error(`[silo] DM postMessage to ${dm.slack_user_id} failed: ${r?.error ?? "no-team-context"}`);
        } else {
          console.log(`[silo] DM postMessage to ${dm.slack_user_id} ok`);
        }
      })
    );
  } else if (event.dm_targets.length > 0) {
    console.warn(`[silo] dm_targets present but no teamId — skipping DMs`);
  }
};

const fetchSlackTeamIdForWorkspace = async (workspaceSlug: string): Promise<string | null> => {
  // Ask Django via the silo-only project-mappings endpoint with no
  // project filter. Cheap + already HMAC-gated.
  const r = await callDjango<{ mappings: ProjectMapping[] }>("POST", "/api/v1/silo/project-mappings/", {
    workspace_slug: workspaceSlug,
    project_id: "00000000-0000-0000-0000-000000000000",
  });
  if (r.status >= 300) return null;
  // Empty for the dummy project — we need a different endpoint. For
  // now, return null and accept that DMs need at least one channel
  // mapping in the workspace to discover team_id. TODO: a dedicated
  // workspace-team-id endpoint.
  return r.data.mappings?.[0]?.connection_team_id ?? null;
};

export const notificationsRouter = (): Router => {
  const r = express.Router();

  r.post(NOTIFICATION_PATH, express.raw({ type: "application/json", limit: "5mb" }), (req: Request, res: Response) => {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
    const ts = req.header("x-silo-timestamp") ?? undefined;
    const sig = req.header("x-silo-signature") ?? undefined;

    // Django signs against the path it sees (full /silo/... path).
    const fullPath = `${config.basePath}${NOTIFICATION_PATH}`;
    const verdict = verifyDjangoHmac(rawBody, "POST", fullPath, ts, sig);
    if (!verdict.ok) {
      res.status(verdict.status).type("text/plain").send(verdict.reason);
      return;
    }

    let event: WorkItemEvent;
    try {
      event = JSON.parse(rawBody.toString("utf8"));
    } catch {
      res.status(400).type("text/plain").send("invalid json");
      return;
    }

    // Ack immediately; do work async.
    res.status(200).end();

    // Slack-side message links MUST use a publicly resolvable URL —
    // Slack's renderers click them. Prefer PLANE_PUBLIC_URL (the
    // tunnel/ALB hostname); fall back to WEB_BASE_URL for envs
    // where they're the same.
    const webBaseUrl = process.env.PLANE_PUBLIC_URL ?? process.env.WEB_BASE_URL ?? "http://localhost:3000";
    dispatch(event, webBaseUrl).catch((err) => {
      console.error("[silo] notifications dispatch crashed:", err);
    });
  });

  return r;
};

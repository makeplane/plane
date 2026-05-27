/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Lists channels the workspace's bot can post into. Used by the FE
 * per-project channel-binding picker.
 *
 *   GET /silo/api/slack/channels?workspaceSlug=<slug>
 *     -> { channels: [{ id, name, is_private, is_member, num_members }] }
 *
 * Backed by Slack `conversations.list` with `types=public_channel,private_channel`.
 * Bot tokens see public channels by default and private channels only
 * if the bot was invited. We surface `is_member` so the FE can warn
 * "invite the bot first" for private channels.
 */

import type { Request, Response, Router } from "express";
import express from "express";

import { asyncHandler } from "../express-async";
import { callSlackApiForTeam } from "./api";
import { resolveTeamContext } from "./team-context";

type SlackConversation = {
  id: string;
  name: string;
  is_private: boolean;
  is_archived: boolean;
  is_member?: boolean;
  num_members?: number;
};

type ConversationsListResponse = {
  ok: boolean;
  error?: string;
  channels?: SlackConversation[];
  response_metadata?: { next_cursor?: string };
};

const PAGE_LIMIT = 200;
const MAX_PAGES = 10; // 2k channels — generous; protects against runaway loops.

const fetchAllChannels = async (teamId: string): Promise<SlackConversation[]> => {
  const out: SlackConversation[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const body: Record<string, unknown> = {
      types: "public_channel,private_channel",
      exclude_archived: true,
      limit: PAGE_LIMIT,
    };
    if (cursor) body.cursor = cursor;
    // Pagination is fundamentally sequential: each request needs the
    // cursor from the previous response. Promise.all isn't applicable.
    // eslint-disable-next-line no-await-in-loop
    const res = await callSlackApiForTeam<ConversationsListResponse>("conversations.list", teamId, body);
    if (!res || !res.ok) {
      throw new Error(`conversations.list failed: ${res?.error ?? "no-team-context"} (team=${teamId})`);
    }
    if (res.channels) out.push(...res.channels);
    cursor = res.response_metadata?.next_cursor;
    if (!cursor) break;
  }
  return out;
};

export const slackChannelsRouter = (): Router => {
  const r = express.Router();

  // asyncHandler wrap: see ../express-async.ts (Express 4 doesn't
  // forward rejected promises from async handlers).
  r.get(
    "/api/slack/channels",
    asyncHandler(async (req: Request, res: Response) => {
      const workspaceSlug = String(req.query.workspaceSlug ?? "").trim();
      if (!workspaceSlug) {
        res.status(400).json({ error: "workspaceSlug required" });
        return;
      }

      // We don't have a (workspaceSlug → teamId) map handy in silo.
      // Easy path: ask Django via team-context-by-slug. But the existing
      // team-context endpoint takes a team_id. Plumb through the slug
      // by looking up the WorkspaceConnection on Django's side. For
      // now, take an explicit teamId query param too — FE has it from
      // the listConnections payload.
      const teamId = String(req.query.teamId ?? "").trim();
      if (!teamId) {
        res.status(400).json({ error: "teamId required" });
        return;
      }

      // Confirm the workspace actually has this Slack team installed
      // before we leak channel data.
      const ctx = await resolveTeamContext(teamId);
      if (!ctx || ctx.workspaceSlug !== workspaceSlug) {
        res.status(404).json({ error: "no Slack install for that workspace+team" });
        return;
      }

      try {
        const channels = await fetchAllChannels(teamId);
        // Trim to fields the FE needs.
        const out = channels.map((c) => ({
          id: c.id,
          name: c.name,
          is_private: c.is_private,
          is_member: c.is_member ?? false,
          num_members: c.num_members ?? 0,
        }));
        // Stable sort: members-first, then alpha by name.
        out.sort((a, b) => {
          if (a.is_member !== b.is_member) return a.is_member ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
        res.json({ channels: out });
      } catch (err) {
        console.error("[silo] channels list failed:", (err as Error).message);
        res.status(502).json({ error: (err as Error).message });
      }
    })
  );

  return r;
};

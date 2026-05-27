/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Resolves a Slack team_id to the Plane workspace + bot token +
 * project list, by calling the Django HMAC endpoint
 * `/api/v1/silo/slack/team-context/`.
 *
 * Cached in-process for `CACHE_TTL_MS` to keep slash commands snappy
 * (Slack expects a 200 within 3s). Cache is keyed on team_id.
 */

import { callDjango } from "../django-client";

export type SlackTeamProject = {
  id: string;
  name: string;
  identifier: string;
};

export type SlackTeamContext = {
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  botToken: string;
  refreshToken: string | null;
  tokenExpiresAt: number | null; // epoch ms
  botUserId: string;
  installerUserId: string | null;
  projects: SlackTeamProject[];
};

const CACHE_TTL_MS = 60_000;

type CacheEntry = { value: SlackTeamContext; fetchedAt: number };
const cache = new Map<string, CacheEntry>();

export const resolveTeamContext = async (teamId: string): Promise<SlackTeamContext | null> => {
  const cached = cache.get(teamId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.value;
  }

  const res = await callDjango<{
    workspace_id: string;
    workspace_slug: string;
    workspace_name: string;
    bot_token: string | null;
    refresh_token: string | null;
    token_expires_at: string | null;
    bot_user_id: string;
    installer_user_id: string | null;
    projects: SlackTeamProject[];
  }>("POST", "/api/v1/silo/slack/team-context/", { team_id: teamId });

  if (res.status === 404) return null;
  if (res.status >= 300) {
    throw new Error(`team-context lookup failed: ${res.status} ${JSON.stringify(res.data)}`);
  }
  if (!res.data.bot_token) {
    throw new Error(`team-context returned no bot_token for team_id=${teamId}`);
  }

  const value: SlackTeamContext = {
    workspaceId: res.data.workspace_id,
    workspaceSlug: res.data.workspace_slug,
    workspaceName: res.data.workspace_name,
    botToken: res.data.bot_token,
    refreshToken: res.data.refresh_token,
    tokenExpiresAt: res.data.token_expires_at ? new Date(res.data.token_expires_at).getTime() : null,
    botUserId: res.data.bot_user_id,
    installerUserId: res.data.installer_user_id,
    projects: res.data.projects ?? [],
  };
  cache.set(teamId, { value, fetchedAt: Date.now() });
  return value;
};

export const invalidateTeamContext = (teamId: string): void => {
  cache.delete(teamId);
};

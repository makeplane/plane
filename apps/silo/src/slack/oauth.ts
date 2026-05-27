/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Slack workspace install (team) OAuth flow.
 *
 *   GET  /silo/api/slack/team/auth/url?workspaceSlug=<slug>
 *        -> redirects browser to Slack authorize page.
 *   GET  /silo/api/slack/team/auth/callback?code=...&state=...
 *        -> exchanges code, persists WorkspaceCredential +
 *           WorkspaceConnection in Django, redirects to FE
 *           Settings → Integrations.
 *
 * State token: random hex, signed-in-memory map keyed to the
 * workspace slug. Short-lived; survives only the browser round-trip.
 * In a multi-instance deploy this should move to Redis. For dev a
 * Map is fine.
 */

import { randomBytes } from "node:crypto";

import axios from "axios";
import type { Request, Response, Router } from "express";
import express from "express";

import { config, getSlackConfig } from "../config";
import { callDjango } from "../django-client";
import { asyncHandler } from "../express-async";

const SLACK_BOT_SCOPES = [
  "channels:read",
  "chat:write",
  "chat:write.public",
  "commands",
  "groups:read",
  "im:history",
  "im:write",
  "links:read",
  "links:write",
  "users:read",
  "users:read.email",
];

const STATE_TTL_MS = 10 * 60 * 1000;

type StateEntry = { workspaceSlug: string; userId: string; createdAt: number };
const stateStore = new Map<string, StateEntry>();

const issueState = (workspaceSlug: string, userId: string): string => {
  const token = randomBytes(24).toString("hex");
  stateStore.set(token, { workspaceSlug, userId, createdAt: Date.now() });
  return token;
};

const consumeState = (token: string): StateEntry | null => {
  const entry = stateStore.get(token);
  if (!entry) return null;
  stateStore.delete(token);
  if (Date.now() - entry.createdAt > STATE_TTL_MS) return null;
  return entry;
};

export type SlackOAuthResponse = {
  ok: boolean;
  error?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  bot_user_id?: string;
  scope?: string;
  team?: { id: string; name: string };
  authed_user?: { id: string };
  app_id?: string;
};

export const buildAuthorizeUrl = (state: string): string => {
  const slack = getSlackConfig();
  const url = new URL("https://slack.com/oauth/v2/authorize");
  url.searchParams.set("client_id", slack.clientId);
  url.searchParams.set("scope", SLACK_BOT_SCOPES.join(","));
  url.searchParams.set("redirect_uri", slack.redirectUrl);
  url.searchParams.set("state", state);
  return url.toString();
};

const exchangeCode = async (code: string): Promise<SlackOAuthResponse> => {
  const slack = getSlackConfig();
  const body = new URLSearchParams({
    client_id: slack.clientId,
    client_secret: slack.clientSecret,
    code,
    redirect_uri: slack.redirectUrl,
  });
  const res = await axios.post<SlackOAuthResponse>("https://slack.com/api/oauth.v2.access", body.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    validateStatus: () => true,
  });
  return res.data;
};

const persistInstall = async (
  workspaceSlug: string,
  installerUserId: string,
  oauth: SlackOAuthResponse
): Promise<void> => {
  if (!oauth.team?.id || !oauth.access_token) {
    throw new Error("oauth response missing team_id or access_token");
  }
  const r = await callDjango("POST", "/api/v1/silo/slack/install/", {
    workspace_slug: workspaceSlug,
    installer_user_id: installerUserId,
    team_id: oauth.team.id,
    team_name: oauth.team.name ?? "",
    bot_user_id: oauth.bot_user_id ?? "",
    access_token: oauth.access_token,
    refresh_token: oauth.refresh_token ?? "",
    expires_in: oauth.expires_in ?? null,
    scope: oauth.scope ?? "",
  });
  if (r.status >= 300) {
    throw new Error(`django ${r.status}: ${JSON.stringify(r.data)}`);
  }
};

export const slackOAuthRouter = (): Router => {
  const r = express.Router();

  r.get("/api/slack/team/auth/url", (req: Request, res: Response) => {
    const workspaceSlug = String(req.query.workspaceSlug ?? "").trim();
    const userId = String(req.query.userId ?? "").trim();
    if (!workspaceSlug || !userId) {
      res.status(400).json({ error: "workspaceSlug and userId required" });
      return;
    }
    const state = issueState(workspaceSlug, userId);
    res.json({ url: buildAuthorizeUrl(state) });
  });

  // Wrapped via asyncHandler so a thrown error inside the handler
  // becomes a 500 instead of an unhandled rejection (Express 4 quirk).
  r.get(
    "/api/slack/team/auth/callback",
    asyncHandler(async (req: Request, res: Response) => {
      const code = String(req.query.code ?? "");
      const state = String(req.query.state ?? "");
      const slackError = req.query.error as string | undefined;

      const feBase = process.env.WEB_BASE_URL ?? "http://localhost:3000";
      const redirectOk = (slug: string) => `${feBase}/${slug}/settings/integrations?slack=connected`;
      const redirectErr = (slug: string, msg: string) =>
        `${feBase}/${slug}/settings/integrations?slack=error&reason=${encodeURIComponent(msg)}`;

      const entry = consumeState(state);
      if (!entry) {
        res.status(400).send("Invalid or expired state");
        return;
      }
      if (slackError) {
        res.redirect(redirectErr(entry.workspaceSlug, slackError));
        return;
      }
      if (!code) {
        res.redirect(redirectErr(entry.workspaceSlug, "no_code"));
        return;
      }

      const oauth = await exchangeCode(code);
      if (!oauth.ok || !oauth.access_token) {
        res.redirect(redirectErr(entry.workspaceSlug, oauth.error ?? "exchange_failed"));
        return;
      }

      try {
        await persistInstall(entry.workspaceSlug, entry.userId, oauth);
      } catch (err) {
        res.redirect(redirectErr(entry.workspaceSlug, `persist_failed:${(err as Error).message}`));
        return;
      }
      res.redirect(redirectOk(entry.workspaceSlug));
    })
  );

  return r;
};

// Re-export so the compiler doesn't complain about config import.
export const slackBasePath = (): string => `${config.basePath}/api/slack`;

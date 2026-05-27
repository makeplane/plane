/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Slack per-user OAuth (personal account connection). Scoped narrowly:
 * we only need to learn the Slack user_id of the Plane user who's
 * connecting, so the only scopes are `identity.basic` + `identity.email`.
 *
 *   GET /silo/api/slack/user/auth/url?workspaceSlug=&planeUserId=
 *      -> returns { url } pointing to slack.com/oauth/v2/authorize
 *         with `user_scope` (not bot scope).
 *   GET /silo/api/slack/user/auth/callback?code=&state=
 *      -> exchange code, call users.identity, persist via Django.
 *
 * State is a short-lived in-memory token (multi-instance prod will
 * need Redis), keyed to the (workspaceSlug, planeUserId) pair.
 *
 * We do not store the user-scope access token anywhere — silo never
 * makes API calls as the user. The mapping is purely Slack user_id <->
 * Plane user_id, used for attribution at create-work-item time.
 */

import { randomBytes } from "node:crypto";

import axios from "axios";
import type { Request, Response, Router } from "express";
import express from "express";

import { getSlackConfig } from "../config";
import { callDjango } from "../django-client";
import { asyncHandler } from "../express-async";

const SLACK_USER_SCOPES = ["identity.basic", "identity.email"];

const STATE_TTL_MS = 10 * 60 * 1000;

type StateEntry = {
  workspaceSlug: string;
  planeUserId: string;
  createdAt: number;
};
const stateStore = new Map<string, StateEntry>();

const issueState = (workspaceSlug: string, planeUserId: string): string => {
  const token = randomBytes(24).toString("hex");
  stateStore.set(token, { workspaceSlug, planeUserId, createdAt: Date.now() });
  return token;
};

const consumeState = (token: string): StateEntry | null => {
  const entry = stateStore.get(token);
  if (!entry) return null;
  stateStore.delete(token);
  if (Date.now() - entry.createdAt > STATE_TTL_MS) return null;
  return entry;
};

type SlackUserOAuthResponse = {
  ok: boolean;
  error?: string;
  authed_user?: {
    id?: string;
    access_token?: string;
    token_type?: string;
    scope?: string;
  };
  team?: { id: string; name: string };
};

type SlackUsersIdentityResponse = {
  ok: boolean;
  error?: string;
  user?: { id?: string; name?: string; email?: string };
  team?: { id: string };
};

const userRedirectUrl = (): string => {
  const base = process.env.SILO_PUBLIC_BASE_URL ?? "http://localhost:3005";
  const path = process.env.SILO_BASE_PATH ?? "/silo";
  return `${base}${path}/api/slack/user/auth/callback`;
};

export const buildUserAuthorizeUrl = (state: string): string => {
  const slack = getSlackConfig();
  const url = new URL("https://slack.com/oauth/v2/authorize");
  url.searchParams.set("client_id", slack.clientId);
  url.searchParams.set("user_scope", SLACK_USER_SCOPES.join(","));
  url.searchParams.set("redirect_uri", userRedirectUrl());
  url.searchParams.set("state", state);
  return url.toString();
};

const exchangeUserCode = async (code: string): Promise<SlackUserOAuthResponse> => {
  const slack = getSlackConfig();
  const body = new URLSearchParams({
    client_id: slack.clientId,
    client_secret: slack.clientSecret,
    code,
    redirect_uri: userRedirectUrl(),
  });
  const res = await axios.post<SlackUserOAuthResponse>("https://slack.com/api/oauth.v2.access", body.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    validateStatus: () => true,
  });
  return res.data;
};

const fetchUserIdentity = async (userToken: string): Promise<SlackUsersIdentityResponse> => {
  const res = await axios.get<SlackUsersIdentityResponse>("https://slack.com/api/users.identity", {
    headers: { Authorization: `Bearer ${userToken}` },
    validateStatus: () => true,
  });
  return res.data;
};

const persistUserMapping = async (
  workspaceSlug: string,
  planeUserId: string,
  slackTeamId: string,
  slackUserId: string,
  slackUserEmail: string
): Promise<void> => {
  const r = await callDjango("POST", "/api/v1/silo/slack/user-connect/", {
    workspace_slug: workspaceSlug,
    plane_user_id: planeUserId,
    slack_team_id: slackTeamId,
    slack_user_id: slackUserId,
    slack_user_email: slackUserEmail,
  });
  if (r.status >= 300) {
    throw new Error(`django ${r.status}: ${JSON.stringify(r.data)}`);
  }
};

export const slackUserOAuthRouter = (): Router => {
  const r = express.Router();

  r.get("/api/slack/user/auth/url", (req: Request, res: Response) => {
    const workspaceSlug = String(req.query.workspaceSlug ?? "").trim();
    const planeUserId = String(req.query.planeUserId ?? "").trim();
    if (!workspaceSlug || !planeUserId) {
      res.status(400).json({ error: "workspaceSlug and planeUserId required" });
      return;
    }
    const state = issueState(workspaceSlug, planeUserId);
    res.json({ url: buildUserAuthorizeUrl(state) });
  });

  // asyncHandler wrap: see ../express-async.ts (Express 4 doesn't
  // forward rejected promises from async handlers).
  r.get(
    "/api/slack/user/auth/callback",
    asyncHandler(async (req: Request, res: Response) => {
      const code = String(req.query.code ?? "");
      const state = String(req.query.state ?? "");
      const slackError = req.query.error as string | undefined;

      const feBase = process.env.WEB_BASE_URL ?? "http://localhost:3000";
      const okUrl = (slug: string) => `${feBase}/${slug}/settings/integrations?slack_user=connected`;
      const errUrl = (slug: string, msg: string) =>
        `${feBase}/${slug}/settings/integrations?slack_user=error&reason=${encodeURIComponent(msg)}`;

      const entry = consumeState(state);
      if (!entry) {
        res.status(400).send("Invalid or expired state");
        return;
      }
      if (slackError) {
        res.redirect(errUrl(entry.workspaceSlug, slackError));
        return;
      }
      if (!code) {
        res.redirect(errUrl(entry.workspaceSlug, "no_code"));
        return;
      }

      const oauth = await exchangeUserCode(code);
      const userToken = oauth.authed_user?.access_token;
      const teamId = oauth.team?.id;
      if (!oauth.ok || !userToken || !teamId) {
        res.redirect(errUrl(entry.workspaceSlug, oauth.error ?? "exchange_failed"));
        return;
      }

      const identity = await fetchUserIdentity(userToken);
      const slackUserId = identity.user?.id;
      const slackEmail = identity.user?.email ?? "";
      if (!identity.ok || !slackUserId) {
        res.redirect(errUrl(entry.workspaceSlug, identity.error ?? "identity_failed"));
        return;
      }

      try {
        await persistUserMapping(entry.workspaceSlug, entry.planeUserId, teamId, slackUserId, slackEmail);
      } catch (err) {
        res.redirect(errUrl(entry.workspaceSlug, `persist_failed:${(err as Error).message}`));
        return;
      }
      res.redirect(okUrl(entry.workspaceSlug));
    })
  );

  return r;
};

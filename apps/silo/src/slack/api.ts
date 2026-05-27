/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Thin Slack Web API client. We intentionally don't depend on
 * @slack/web-api — silo only needs a handful of methods and the
 * official SDK pulls in a lot of surface area.
 *
 * `callSlackApiForTeam` automatically refreshes the bot token on
 * `token_expired` (workspaces with rotation enabled) and retries
 * once. Callers that already have a known-fresh token can use
 * `callSlackApi` directly.
 */

import axios from "axios";

import { refreshBotToken } from "./refresh";
import { resolveTeamContext } from "./team-context";

export type SlackApiResponse = {
  ok: boolean;
  error?: string;
  [k: string]: unknown;
};

export const callSlackApi = async <T extends SlackApiResponse = SlackApiResponse>(
  method: string,
  botToken: string,
  body: Record<string, unknown>
): Promise<T> => {
  const res = await axios.post<T>(`https://slack.com/api/${method}`, body, {
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    validateStatus: () => true,
  });
  return res.data;
};

/**
 * Call a Slack Web API method using the bot token bound to `teamId`.
 * On `token_expired`, refreshes the token via `oauth.v2.access` and
 * retries once. Returns null if the team has no Slack connection.
 */
export const callSlackApiForTeam = async <T extends SlackApiResponse = SlackApiResponse>(
  method: string,
  teamId: string,
  body: Record<string, unknown>
): Promise<T | null> => {
  const ctx = await resolveTeamContext(teamId);
  if (!ctx) return null;

  let result = await callSlackApi<T>(method, ctx.botToken, body);
  // token_expired is the documented rotation signal; invalid_auth shows
  // up when the stored token is garbage (manual DB edit, partial install,
  // or a token Slack revoked). Both warrant one refresh attempt — if the
  // refresh_token itself is bad, the second call will surface a real
  // error rather than masking it.
  if (result.ok) return result;
  if (result.error !== "token_expired" && result.error !== "invalid_auth") {
    return result;
  }
  if (!ctx.refreshToken) return result;

  console.warn(`[silo] ${method} got ${result.error}, refreshing (team=${teamId})`);
  const fresh = await refreshBotToken(teamId);
  if (!fresh) return result; // refresh failed; surface the original error

  result = await callSlackApi<T>(method, fresh, body);
  return result;
};

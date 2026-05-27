/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Verifies the X-Slack-Signature header on inbound requests from
 * Slack (slash commands, interactivity, events). Scheme:
 *   sig_basestring = "v0:" + ts + ":" + raw_body
 *   expected       = "v0=" + hex(HMAC_SHA256(signing_secret, sig_basestring))
 *   compare        = timing-safe equal to X-Slack-Signature
 *
 * Ref: https://api.slack.com/authentication/verifying-requests-from-slack
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const SKEW_SECONDS = 5 * 60;

export type SlackVerifyResult = { ok: true } | { ok: false; status: number; reason: string };

export const verifySlackSignature = (
  signingSecret: string,
  rawBody: Buffer | string,
  timestamp: string | undefined,
  signature: string | undefined,
  now: number = Math.floor(Date.now() / 1000)
): SlackVerifyResult => {
  if (!timestamp || !signature) {
    return { ok: false, status: 401, reason: "missing signature headers" };
  }
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) {
    return { ok: false, status: 401, reason: "bad timestamp" };
  }
  if (Math.abs(now - ts) > SKEW_SECONDS) {
    return { ok: false, status: 401, reason: "timestamp skew too large" };
  }
  const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  const base = `v0:${timestamp}:${body}`;
  const expected = `v0=${createHmac("sha256", signingSecret).update(base).digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, status: 401, reason: "invalid signature" };
  }
  return { ok: true };
};

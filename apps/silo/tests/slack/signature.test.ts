/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Spec for verifySlackSignature — the security boundary between
 * Slack's webhooks and silo. Pure function, easy to exercise.
 */

import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { verifySlackSignature } from "../../src/slack/signature";

const SECRET = "test-signing-secret";

const sign = (rawBody: string | Buffer, ts: string): string => {
  const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  const base = `v0:${ts}:${body}`;
  return `v0=${createHmac("sha256", SECRET).update(base).digest("hex")}`;
};

describe("verifySlackSignature", () => {
  it("rejects when timestamp is missing", () => {
    const result = verifySlackSignature(SECRET, "body", undefined, "v0=foo");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it("rejects when signature is missing", () => {
    const result = verifySlackSignature(SECRET, "body", "1234", undefined);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it("rejects non-numeric timestamp", () => {
    const result = verifySlackSignature(SECRET, "body", "not-a-number", "v0=foo");
    expect(result.ok).toBe(false);
  });

  it("rejects timestamps older than the 5-minute skew window", () => {
    const now = 1_000_000_000;
    const stale = String(now - 600);
    const sig = sign("body", stale);
    const result = verifySlackSignature(SECRET, "body", stale, sig, now);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/skew/i);
  });

  it("rejects timestamps too far in the future", () => {
    const now = 1_000_000_000;
    const future = String(now + 600);
    const sig = sign("body", future);
    const result = verifySlackSignature(SECRET, "body", future, sig, now);
    expect(result.ok).toBe(false);
  });

  it("rejects forged signatures", () => {
    const now = 1_000_000_000;
    const ts = String(now);
    const result = verifySlackSignature(SECRET, "body", ts, "v0=deadbeef", now);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/invalid signature/i);
  });

  it("rejects signatures over a different body", () => {
    const now = 1_000_000_000;
    const ts = String(now);
    const sig = sign("original-body", ts);
    const result = verifySlackSignature(SECRET, "tampered-body", ts, sig, now);
    expect(result.ok).toBe(false);
  });

  it("accepts valid signatures (string body)", () => {
    const now = 1_000_000_000;
    const ts = String(now);
    const sig = sign("body", ts);
    const result = verifySlackSignature(SECRET, "body", ts, sig, now);
    expect(result.ok).toBe(true);
  });

  it("accepts valid signatures (buffer body)", () => {
    const now = 1_000_000_000;
    const ts = String(now);
    const body = Buffer.from("payload=abc&team_id=T1");
    const sig = sign(body, ts);
    const result = verifySlackSignature(SECRET, body, ts, sig, now);
    expect(result.ok).toBe(true);
  });

  it("accepts at the edge of the skew window (just inside)", () => {
    const now = 1_000_000_000;
    const ts = String(now - 299);
    const sig = sign("body", ts);
    const result = verifySlackSignature(SECRET, "body", ts, sig, now);
    expect(result.ok).toBe(true);
  });

  it("rejects just past the skew window (one second over)", () => {
    const now = 1_000_000_000;
    const ts = String(now - 301);
    const sig = sign("body", ts);
    const result = verifySlackSignature(SECRET, "body", ts, sig, now);
    expect(result.ok).toBe(false);
  });

  it("uses constant-time comparison (length mismatch fails before bytes diverge)", () => {
    // Implementation detail — the function should still return false-ish
    // for a clearly-too-short signature. A tighter test would patch
    // timingSafeEqual; this is a smoke check.
    const now = 1_000_000_000;
    const ts = String(now);
    const result = verifySlackSignature(SECRET, "body", ts, "v0=short", now);
    expect(result.ok).toBe(false);
  });
});

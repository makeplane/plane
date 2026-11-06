/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";

import {
  PERMISSION_LEVELS,
  TicketReplayGuard,
  clampPermissionLevel,
  signSpawnTicket,
  verifySpawnTicket,
  type SpawnClaims,
} from "../src/index.ts";

const SECRET = "s".repeat(40);
const CLAIMS: SpawnClaims = {
  adapter: "claude",
  env: { ANTHROPIC_API_KEY: "sk-ant-test" },
  userId: "11111111-1111-4111-8111-111111111111",
  workspaceId: "22222222-2222-4222-8222-222222222222",
  initialMode: "ask_writes",
  sessionRef: "33333333-3333-4333-8333-333333333333",
};

function tamper(token: string, mutate: (claims: Record<string, unknown>) => void): string {
  const [version, payload, signature] = token.split(".") as [string, string, string];
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
  mutate(claims);
  return [version, Buffer.from(JSON.stringify(claims)).toString("base64url"), signature].join(".");
}

describe("spawn tickets", () => {
  it("round-trips valid claims", () => {
    const now = 1_000_000;
    const result = verifySpawnTicket(signSpawnTicket(CLAIMS, SECRET, { now, jti: "j1" }), SECRET, { now: now + 1 });
    expect(result).toEqual({ ok: true, ticket: { ...CLAIMS, iat: now, exp: now + 60_000, jti: "j1" } });
  });

  it("rejects an expired ticket", () => {
    const token = signSpawnTicket(CLAIMS, SECRET, { now: 1_000, ttlMs: 1_000 });
    expect(verifySpawnTicket(token, SECRET, { now: 2_000 })).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects a ticket issued in the future", () => {
    const token = signSpawnTicket(CLAIMS, SECRET, { now: 100_000 });
    expect(verifySpawnTicket(token, SECRET, { now: 0 })).toEqual({ ok: false, reason: "not_yet_valid" });
  });

  it("rejects a ticket whose lifetime is longer than the runner allows", () => {
    const token = signSpawnTicket(CLAIMS, SECRET, { now: 0, ttlMs: 60 * 60_000 });
    expect(verifySpawnTicket(token, SECRET, { now: 1 })).toEqual({ ok: false, reason: "invalid_claims" });
  });

  it("rejects tampered claims", () => {
    const token = signSpawnTicket(CLAIMS, SECRET);
    for (const mutate of [
      (claims: Record<string, unknown>) => (claims.adapter = "codex"),
      (claims: Record<string, unknown>) => (claims.initialMode = "yolo"),
      (claims: Record<string, unknown>) => (claims.exp = (claims.exp as number) + 1),
      (claims: Record<string, unknown>) => (claims.env = { ...(claims.env as object), LD_PRELOAD: "/x.so" }),
    ]) {
      expect(verifySpawnTicket(tamper(token, mutate), SECRET)).toEqual({ ok: false, reason: "bad_signature" });
    }
  });

  it("rejects a ticket signed with another secret", () => {
    const token = signSpawnTicket(CLAIMS, "o".repeat(40));
    expect(verifySpawnTicket(token, SECRET)).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("rejects malformed tokens", () => {
    for (const token of ["", "v1", "v1.abc", "v2.abc.def", "v1..sig", "v1.abc.def.ghi"]) {
      expect(verifySpawnTicket(token, SECRET).ok).toBe(false);
    }
    const token = signSpawnTicket(CLAIMS, SECRET);
    expect(verifySpawnTicket(token.slice(0, -2), SECRET)).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("rejects well-signed claims that are invalid", () => {
    for (const bad of [
      { ...CLAIMS, adapter: "../../bin/sh" },
      { ...CLAIMS, userId: "../etc" },
      { ...CLAIMS, workspaceId: "not-a-uuid" },
      { ...CLAIMS, initialMode: "root" },
      { ...CLAIMS, env: { lower_case: "x" } },
      { ...CLAIMS, env: { NUMBER: 1 } },
    ]) {
      const token = signSpawnTicket(bad as unknown as SpawnClaims, SECRET);
      expect(verifySpawnTicket(token, SECRET)).toEqual({ ok: false, reason: "invalid_claims" });
    }
  });

  it("refuses short secrets", () => {
    expect(() => signSpawnTicket(CLAIMS, "short")).toThrow(/at least 32/);
    expect(() => verifySpawnTicket("v1.a.b", "short")).toThrow(/at least 32/);
  });
});

describe("TicketReplayGuard", () => {
  it("accepts a ticket once and forgets it after expiry", () => {
    const guard = new TicketReplayGuard();
    const result = verifySpawnTicket(signSpawnTicket(CLAIMS, SECRET, { now: 0, ttlMs: 1_000 }), SECRET, { now: 1 });
    if (!result.ok) throw new Error("expected a valid ticket");
    expect(guard.claim(result.ticket, 1)).toBe(true);
    expect(guard.claim(result.ticket, 2)).toBe(false);
    expect(guard.claim({ ...result.ticket, jti: "other" }, 3_000)).toBe(true);
    expect(guard.size).toBe(1);
  });
});

describe("permission levels", () => {
  it("keeps the API and adapter order", () => {
    expect(PERMISSION_LEVELS).toEqual(["ask_all", "ask_writes", "yolo"]);
  });

  it("clamps to the maximum", () => {
    expect(clampPermissionLevel("yolo", "ask_writes")).toBe("ask_writes");
    expect(clampPermissionLevel("ask_all", "ask_writes")).toBe("ask_all");
    expect(clampPermissionLevel("ask_writes", "ask_writes")).toBe("ask_writes");
  });
});

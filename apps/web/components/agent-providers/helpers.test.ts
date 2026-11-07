/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { AgentConnectionError } from "@plane/services";
import type { TAgentProviderEntry } from "@plane/types";
import {
  apiErrorMessage,
  credentialState,
  deriveProviderCard,
  normalizeApiKey,
  orderProviderEntries,
  safeExternalUrl,
  signInErrorReason,
} from "./helpers";

const entry = (patch: Partial<TAgentProviderEntry> = {}): TAgentProviderEntry => ({
  provider: "openai",
  personal: null,
  workspace: null,
  instance_configured: false,
  can_manage_workspace: false,
  ...patch,
});

const API_KEY = { method: "api_key" as const, secret_hint: "abcd", account_label: "", updated_at: "" };
const CHATGPT = { method: "chatgpt" as const, secret_hint: "", account_label: "me@example.com", updated_at: "" };

describe("credentialState", () => {
  it("describes a missing credential, a key and an account", () => {
    expect(credentialState(null)).toEqual({ kind: "none" });
    expect(credentialState(API_KEY)).toEqual({ kind: "api_key", hint: "abcd" });
    expect(credentialState(CHATGPT)).toEqual({ kind: "account", method: "chatgpt", email: "me@example.com" });
    expect(credentialState({ ...CHATGPT, account_label: null })).toMatchObject({ email: "" });
  });
});

describe("deriveProviderCard", () => {
  it("offers a key and the ChatGPT sign-in when OpenAI has no personal credential", () => {
    expect(deriveProviderCard(entry()).personalActions).toEqual(["add_api_key", "sign_in"]);
    expect(deriveProviderCard(entry()).accountMethod).toBe("chatgpt");
    expect(deriveProviderCard(entry({ provider: "google" })).accountMethod).toBe("google_account");
  });

  it("offers only an API key for Anthropic, with the subscription note", () => {
    const card = deriveProviderCard(entry({ provider: "anthropic" }));
    expect(card.personalActions).toEqual(["add_api_key"]);
    expect(card.accountMethod).toBeUndefined();
    expect(card.showSubscriptionNote).toBe(true);
    expect(deriveProviderCard(entry()).showSubscriptionNote).toBe(false);
  });

  it("offers replace and remove for a key, disconnect for an account", () => {
    expect(deriveProviderCard(entry({ personal: API_KEY })).personalActions).toEqual(["replace", "remove"]);
    expect(deriveProviderCard(entry({ personal: CHATGPT })).personalActions).toEqual(["disconnect"]);
  });

  it("lets only admins change the workspace key", () => {
    expect(deriveProviderCard(entry()).workspaceActions).toEqual([]);
    expect(deriveProviderCard(entry({ workspace: API_KEY })).workspaceActions).toEqual([]);
    expect(deriveProviderCard(entry({ can_manage_workspace: true })).workspaceActions).toEqual(["add"]);
    expect(deriveProviderCard(entry({ can_manage_workspace: true, workspace: API_KEY })).workspaceActions).toEqual([
      "replace",
      "remove",
    ]);
  });

  it("explains the fallback only when neither a personal nor a workspace credential is set", () => {
    expect(deriveProviderCard(entry()).fallback).toBe("missing");
    expect(deriveProviderCard(entry({ instance_configured: true })).fallback).toBe("instance");
    expect(deriveProviderCard(entry({ personal: API_KEY })).fallback).toBeNull();
    expect(deriveProviderCard(entry({ workspace: API_KEY })).fallback).toBeNull();
  });
});

describe("orderProviderEntries", () => {
  it("shows Anthropic, OpenAI, Google in that order and skips unknown providers", () => {
    const entries = [
      entry({ provider: "google" }),
      entry({ provider: "deepseek" as never }),
      entry({ provider: "anthropic" }),
      entry({ provider: "openai" }),
    ];
    expect(orderProviderEntries(entries).map((item) => item.provider)).toEqual(["anthropic", "openai", "google"]);
  });
});

describe("normalizeApiKey", () => {
  it("trims, and enforces 8–512 characters with no whitespace", () => {
    expect(normalizeApiKey("  sk-12345678 \n")).toBe("sk-12345678");
    expect(normalizeApiKey("short")).toBeNull();
    expect(normalizeApiKey("sk-1234 5678")).toBeNull();
    expect(normalizeApiKey("x".repeat(512))).toHaveLength(512);
    expect(normalizeApiKey("x".repeat(513))).toBeNull();
  });
});

describe("apiErrorMessage", () => {
  it("returns the first DRF message", () => {
    expect(apiErrorMessage({ api_key: ["Too short."] })).toBe("Too short.");
    expect(apiErrorMessage({ error: "Forbidden" })).toBe("Forbidden");
    expect(apiErrorMessage(undefined)).toBeUndefined();
    expect(apiErrorMessage({ api_key: [] })).toBeUndefined();
  });
});

describe("signInErrorReason", () => {
  it("maps bridge statuses to a message", () => {
    expect(signInErrorReason(new AgentConnectionError(0, "offline"))).toBe("unreachable");
    expect(signInErrorReason(new AgentConnectionError(502, "runner down"))).toBe("unreachable");
    expect(signInErrorReason(new AgentConnectionError(404, "unknown login"))).toBe("expired");
    expect(signInErrorReason(new AgentConnectionError(429, "slow down"))).toBe("rate_limited");
    expect(signInErrorReason(new AgentConnectionError(401, "signed out"))).toBe("signed_out");
    expect(signInErrorReason(new AgentConnectionError(403, "not a member"))).toBe("failed");
    expect(signInErrorReason(new Error("boom"))).toBe("failed");
  });
});

describe("safeExternalUrl", () => {
  it("allows http(s) links only", () => {
    expect(safeExternalUrl("https://auth.openai.com/codex/device")).toBe("https://auth.openai.com/codex/device");
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("not a url")).toBeNull();
    expect(safeExternalUrl(undefined)).toBeNull();
  });
});

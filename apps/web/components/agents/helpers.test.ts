/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { AgentCloseCode } from "@plane/acp-client";
// The English catalog is the source of truth; check:sync keeps the other locales in step.
import en from "../../../../packages/i18n/src/locales/en/agents.json";
import { chatErrorMessage, closeReasonKey, formatJson, modeName, permissionOptionLabel } from "./helpers";

function lookup(key: string): unknown {
  return key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], en);
}

const t = (key: string, params?: Record<string, unknown>) => {
  const value = lookup(key);
  if (typeof value !== "string") throw new Error(`missing translation: ${key}`);
  return value.replace(/\{(\w+)\}/g, (_, name: string) => String(params?.[name] ?? ""));
};

describe("agent chat helpers", () => {
  it("has a message for every bridge close code", () => {
    for (const code of Object.values(AgentCloseCode)) {
      expect(typeof lookup(closeReasonKey({ code, reason: "", wasClean: true }))).toBe("string");
    }
    expect(closeReasonKey({ code: 4999, reason: "", wasClean: true })).toBe("agents.close.reasons.unknown");
    expect(t(closeReasonKey({ code: 4429, reason: "", wasClean: true }))).toMatch(/too many chats/);
  });

  it("has a message for every failed action and the mode error", () => {
    const actions = [
      "connect",
      "new_session",
      "load_session",
      "list_sessions",
      "prompt",
      "set_mode",
      "set_model",
      "reconnect",
    ] as const;
    for (const action of actions) {
      expect(chatErrorMessage(t, { kind: "request", action, code: -32603, message: "x" })).not.toBe("");
    }
    expect(chatErrorMessage(t, { kind: "mode_not_allowed", modeId: "yolo" }, "Never ask")).toBe(
      'Your admin does not allow the "Never ask" level for this agent.'
    );
  });

  it("translates our permission levels and keeps other agents' mode names", () => {
    expect(modeName(t, { id: "ask_writes", name: "x" })).toBe("Ask before changes");
    expect(modeName(t, { id: "architect", name: "Architect" })).toBe("Architect");
  });

  it("labels the standard permission options", () => {
    expect(permissionOptionLabel(t, { optionId: "a", kind: "allow_always", name: "x" })).toBe(
      "Always allow in this chat"
    );
    expect(permissionOptionLabel(t, { optionId: "b", kind: "other" as never, name: "Custom" })).toBe("Custom");
  });

  it("formats tool input as JSON and truncates it", () => {
    expect(formatJson({ a: 1 })).toBe('{\n  "a": 1\n}');
    expect(formatJson("x".repeat(10), 4)).toBe("xxxx…");
    expect(formatJson(undefined)).toBe("");
  });
});

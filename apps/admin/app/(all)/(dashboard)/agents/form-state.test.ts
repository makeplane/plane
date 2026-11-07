/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { AGENT_ENV_MASK } from "@plane/constants";
import type { TInstanceAgent } from "@plane/types";
import {
  allowedDefaultLevels,
  buildPayload,
  createFormState,
  desiredEnv,
  envFieldsFor,
  otherEnvKeys,
  serverFieldErrors,
  slugify,
  validateForm,
  withMaxLevel,
} from "./form-state";
import type { TAgentFormState } from "./form-state";

const AGENT: TInstanceAgent = {
  id: "a1",
  name: "Claude",
  slug: "claude",
  description: "",
  adapter: "claude",
  env: { ANTHROPIC_API_KEY: AGENT_ENV_MASK, CUSTOM_FLAG: AGENT_ENV_MASK, PLANE_AGENT_MODEL: AGENT_ENV_MASK },
  env_decryption_failed: false,
  default_permission_level: "ask_writes",
  max_permission_level: "ask_writes",
  attach_plane_mcp: true,
  is_enabled: true,
  sort_order: 1,
  created_at: "",
  updated_at: "",
};

const EMPTY_ENTRY = { saved: false, value: "", remove: false };

const setEnv = (
  state: TAgentFormState,
  key: string,
  patch: Partial<TAgentFormState["env"][string]>
): TAgentFormState => ({
  ...state,
  env: { ...state.env, [key]: { ...(state.env[key] ?? EMPTY_ENTRY), ...patch } },
});

describe("agent form: create", () => {
  it("sends every field and only the env values that were entered", () => {
    let state: TAgentFormState = { ...createFormState(), name: "DeepSeek", slug: "deepseek", adapter: "deepseek" };
    state = setEnv(state, "DEEPSEEK_API_KEY", { value: " sk-1 " });
    state = setEnv(state, "ANTHROPIC_API_KEY", { value: "ignored: other adapter" });
    expect(buildPayload(state)).toEqual({
      name: "DeepSeek",
      slug: "deepseek",
      description: "",
      adapter: "deepseek",
      default_permission_level: "ask_writes",
      max_permission_level: "ask_writes",
      attach_plane_mcp: true,
      is_enabled: true,
      env: { DEEPSEEK_API_KEY: "sk-1" },
    });
  });

  it("derives a slug from the name", () => {
    expect(slugify("  Claude Opus (Prod)! ")).toBe("claude-opus-prod");
    expect(slugify("Ünïcode Agent")).toBe("unicode-agent");
  });
});

describe("agent form: update keeps secrets write-only", () => {
  it("omits env when nothing in it changed", () => {
    const state = { ...createFormState(AGENT), description: "Writes code" };
    expect(buildPayload(state, AGENT)).toEqual({ description: "Writes code" });
  });

  it("sends the mask for kept values and the new value for a replaced one", () => {
    const state = setEnv(createFormState(AGENT), "ANTHROPIC_API_KEY", { value: "sk-new" });
    expect(buildPayload(state, AGENT)).toEqual({
      env: { ANTHROPIC_API_KEY: "sk-new", PLANE_AGENT_MODEL: AGENT_ENV_MASK, CUSTOM_FLAG: AGENT_ENV_MASK },
    });
  });

  it("drops a removed value", () => {
    const state = setEnv(createFormState(AGENT), "PLANE_AGENT_MODEL", { remove: true });
    expect(buildPayload(state, AGENT).env).toEqual({ ANTHROPIC_API_KEY: AGENT_ENV_MASK, CUSTOM_FLAG: AGENT_ENV_MASK });
  });

  it("keeps variables set through the API, and lets them be removed", () => {
    const state = createFormState(AGENT);
    expect(otherEnvKeys(state)).toEqual(["CUSTOM_FLAG"]);
    expect(desiredEnv(setEnv(state, "CUSTOM_FLAG", { remove: true }))).not.toHaveProperty("CUSTOM_FLAG");
  });

  it("drops the old adapter's credentials when the adapter changes", () => {
    let state: TAgentFormState = { ...createFormState(AGENT), adapter: "codex" };
    state = setEnv(state, "OPENAI_API_KEY", { value: "sk-openai" });
    expect(buildPayload(state, AGENT)).toEqual({
      adapter: "codex",
      env: { OPENAI_API_KEY: "sk-openai", PLANE_AGENT_MODEL: AGENT_ENV_MASK, CUSTOM_FLAG: AGENT_ENV_MASK },
    });
  });
});

describe("agent form: Gemini", () => {
  it("shows the Gemini key, the sign-in method and the common fields", () => {
    expect(envFieldsFor("gemini").map((field) => field.key)).toEqual([
      "GEMINI_API_KEY",
      "PLANE_AGENT_AUTH",
      "PLANE_AGENT_MODEL",
    ]);
    expect(envFieldsFor("gemini").find((field) => field.key === "GEMINI_API_KEY")?.secret).toBe(true);
  });

  it("sends the Gemini key and sign-in method, and drops Claude's key when switching", () => {
    let state: TAgentFormState = { ...createFormState(AGENT), adapter: "gemini" };
    state = setEnv(state, "GEMINI_API_KEY", { value: " gm-key " });
    state = setEnv(state, "PLANE_AGENT_AUTH", { value: "api_key" });
    expect(buildPayload(state, AGENT)).toEqual({
      adapter: "gemini",
      env: {
        GEMINI_API_KEY: "gm-key",
        PLANE_AGENT_AUTH: "api_key",
        PLANE_AGENT_MODEL: AGENT_ENV_MASK,
        CUSTOM_FLAG: AGENT_ENV_MASK,
      },
    });
  });

  it("does not list PLANE_AGENT_AUTH under other variables", () => {
    const state = createFormState({ ...AGENT, adapter: "gemini", env: { PLANE_AGENT_AUTH: AGENT_ENV_MASK } });
    expect(otherEnvKeys(state)).toEqual([]);
  });
});

describe("agent form: validation", () => {
  const valid = () => createFormState(AGENT);

  it("accepts a saved agent as is", () => {
    expect(validateForm(valid())).toEqual({});
  });

  it("requires a name and a lowercase slug", () => {
    expect(validateForm({ ...valid(), name: " ", slug: "" })).toMatchObject({ name: "required", slug: "required" });
    expect(validateForm({ ...valid(), slug: "Has Spaces" })).toMatchObject({ slug: "slug" });
  });

  it("needs no Claude credential (members' and workspace keys come first)", () => {
    expect(validateForm(setEnv(valid(), "ANTHROPIC_API_KEY", { remove: true }))).toEqual({});
  });

  it("requires a DeepSeek key, and nothing for Codex or Gemini (members can sign in themselves)", () => {
    expect(validateForm({ ...valid(), adapter: "deepseek" })).toEqual({ DEEPSEEK_API_KEY: "deepseek_auth" });
    expect(validateForm({ ...valid(), adapter: "codex" })).toEqual({});
    expect(validateForm({ ...valid(), adapter: "gemini" })).toEqual({});
  });

  it("requires re-entering credentials that could not be decrypted", () => {
    const state = createFormState({ ...AGENT, adapter: "deepseek", env: {}, env_decryption_failed: true });
    expect(validateForm(state)).toEqual({ DEEPSEEK_API_KEY: "deepseek_auth" });
  });

  it("keeps the default level at or below the maximum", () => {
    const state = { ...valid(), default_permission_level: "yolo" as const };
    expect(validateForm(state)).toEqual({ default_permission_level: "default_above_max" });
    const raised = withMaxLevel(
      { ...valid(), max_permission_level: "yolo", default_permission_level: "yolo" },
      "ask_all"
    );
    expect(raised).toMatchObject({ max_permission_level: "ask_all", default_permission_level: "ask_all" });
    expect(allowedDefaultLevels("ask_writes")).toEqual(["ask_all", "ask_writes"]);
  });
});

describe("serverFieldErrors", () => {
  it("flattens DRF field errors", () => {
    expect(serverFieldErrors({ slug: ["taken"], env: "bad", other: 3 })).toEqual({ slug: "taken", env: "bad" });
    expect(serverFieldErrors(undefined)).toEqual({});
  });
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import {
  AGENT_ADAPTER_ENV_FIELDS,
  AGENT_COMMON_ENV_FIELDS,
  AGENT_ENV_MASK,
  AGENT_PERMISSION_LEVELS,
  getAgentPermissionRank,
} from "@plane/constants";
import type { TAgentEnvField } from "@plane/constants";
import type { TAgentAdapter, TAgentPermissionLevel, TInstanceAgent, TInstanceAgentPayload } from "@plane/types";

/**
 * One env variable in the form. Saved values are never sent to the browser, so a saved variable
 * starts empty: leaving it empty keeps it, typing replaces it, `remove` drops it.
 */
export type TEnvValueState = {
  saved: boolean;
  value: string;
  remove: boolean;
};

export type TAgentFormState = {
  name: string;
  slug: string;
  /** The slug follows the name until the admin edits it (new agents only). */
  slugTouched: boolean;
  description: string;
  adapter: TAgentAdapter;
  default_permission_level: TAgentPermissionLevel;
  max_permission_level: TAgentPermissionLevel;
  attach_plane_mcp: boolean;
  is_enabled: boolean;
  env: Record<string, TEnvValueState>;
};

export type TAgentFormErrorKey = "required" | "slug" | "default_above_max" | "deepseek_auth";

export type TAgentFormErrors = Partial<Record<string, TAgentFormErrorKey>>;

const SLUG_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

/** Every env key some adapter form knows. */
const KNOWN_ENV_KEYS = new Set(
  [...Object.values(AGENT_ADAPTER_ENV_FIELDS).flat(), ...AGENT_COMMON_ENV_FIELDS].map((field) => field.key)
);

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

/** The fields the form shows for an adapter: its own, then the ones every adapter reads. */
export function envFieldsFor(adapter: TAgentAdapter): readonly TAgentEnvField[] {
  return [...(AGENT_ADAPTER_ENV_FIELDS[adapter] ?? []), ...AGENT_COMMON_ENV_FIELDS];
}

/** Saved variables no adapter form knows (set through the API); kept unless removed. In API order (sorted). */
export function otherEnvKeys(state: TAgentFormState): string[] {
  return Object.keys(state.env).filter((key) => state.env[key]?.saved && !KNOWN_ENV_KEYS.has(key));
}

export function createFormState(agent?: TInstanceAgent): TAgentFormState {
  const env: Record<string, TEnvValueState> = {};
  for (const key of Object.keys(agent?.env ?? {})) env[key] = { saved: true, value: "", remove: false };
  return {
    name: agent?.name ?? "",
    slug: agent?.slug ?? "",
    slugTouched: !!agent,
    description: agent?.description ?? "",
    adapter: agent?.adapter ?? "claude",
    default_permission_level: agent?.default_permission_level ?? "ask_writes",
    max_permission_level: agent?.max_permission_level ?? "ask_writes",
    attach_plane_mcp: agent?.attach_plane_mcp ?? true,
    is_enabled: agent?.is_enabled ?? true,
    env,
  };
}

export function envValue(state: TAgentFormState, key: string): TEnvValueState {
  return state.env[key] ?? { saved: false, value: "", remove: false };
}

/** The variable will hold a value after saving. */
function willBeSet(state: TAgentFormState, key: string): boolean {
  const entry = envValue(state, key);
  return entry.value.trim() !== "" || (entry.saved && !entry.remove);
}

/** Keys sent on save: the adapter's and the common fields, plus saved variables no form knows. */
function submittedEnvKeys(state: TAgentFormState): string[] {
  return [...envFieldsFor(state.adapter).map((field) => field.key), ...otherEnvKeys(state)];
}

/**
 * The env to send: the complete desired set, with the mask for every saved value to keep.
 * Saved variables of another adapter (after switching adapters) are dropped.
 */
export function desiredEnv(state: TAgentFormState): Record<string, string> {
  const env: Record<string, string> = {};
  for (const key of submittedEnvKeys(state)) {
    const entry = envValue(state, key);
    const value = entry.value.trim();
    if (value) env[key] = value;
    else if (entry.saved && !entry.remove) env[key] = AGENT_ENV_MASK;
  }
  return env;
}

/** Changing the maximum level pulls the default down with it, so default ≤ max always holds. */
export function withMaxLevel(state: TAgentFormState, max: TAgentPermissionLevel): TAgentFormState {
  const defaultLevel =
    getAgentPermissionRank(state.default_permission_level) > getAgentPermissionRank(max)
      ? max
      : state.default_permission_level;
  return { ...state, max_permission_level: max, default_permission_level: defaultLevel };
}

/** Default levels the form offers: those at or below the maximum. */
export function allowedDefaultLevels(max: TAgentPermissionLevel): TAgentPermissionLevel[] {
  return AGENT_PERMISSION_LEVELS.filter((level) => getAgentPermissionRank(level) <= getAgentPermissionRank(max));
}

export function validateForm(state: TAgentFormState): TAgentFormErrors {
  const errors: TAgentFormErrors = {};
  if (!state.name.trim()) errors.name = "required";
  if (!state.slug.trim()) errors.slug = "required";
  else if (!SLUG_PATTERN.test(state.slug)) errors.slug = "slug";
  if (getAgentPermissionRank(state.default_permission_level) > getAgentPermissionRank(state.max_permission_level)) {
    errors.default_permission_level = "default_above_max";
  }
  // Each group of alternative credentials needs one value; the error sits on the group's first field.
  const groups = new Map<string, string[]>();
  for (const field of envFieldsFor(state.adapter)) {
    if (field.requiredGroup) groups.set(field.requiredGroup, [...(groups.get(field.requiredGroup) ?? []), field.key]);
  }
  for (const [group, keys] of groups) {
    if (!keys.some((key) => willBeSet(state, key))) errors[keys[0]!] = group as TAgentFormErrorKey;
  }
  return errors;
}

/**
 * The create or update payload. On update, unchanged fields are left out, and `env` is sent only
 * when a variable is replaced, added or removed (or the adapter changed, which drops the old
 * adapter's credentials); saved secrets are never re-sent, only the mask.
 */
export function buildPayload(state: TAgentFormState, agent?: TInstanceAgent): TInstanceAgentPayload {
  const fields = {
    name: state.name.trim(),
    slug: state.slug.trim(),
    description: state.description.trim(),
    adapter: state.adapter,
    default_permission_level: state.default_permission_level,
    max_permission_level: state.max_permission_level,
    attach_plane_mcp: state.attach_plane_mcp,
    is_enabled: state.is_enabled,
  } satisfies TInstanceAgentPayload;
  const env = desiredEnv(state);

  if (!agent) return { ...fields, env };

  const payload: TInstanceAgentPayload = {};
  for (const [key, value] of Object.entries(fields) as [keyof typeof fields, (typeof fields)[keyof typeof fields]][]) {
    if (agent[key] !== value) Object.assign(payload, { [key]: value });
  }
  const savedKeys = Object.keys(agent.env);
  const envChanged =
    // An env the API cannot decrypt is always replaced, or it would stay and fail every chat.
    agent.env_decryption_failed ||
    Object.values(env).some((value) => value !== AGENT_ENV_MASK) ||
    savedKeys.length !== Object.keys(env).length ||
    savedKeys.some((key) => !(key in env));
  if (envChanged) payload.env = env;
  return payload;
}

/** DRF field errors (`{field: [message]}`) as one message per field. */
export function serverFieldErrors(error: unknown): Record<string, string> {
  if (!error || typeof error !== "object") return {};
  const result: Record<string, string> = {};
  for (const [field, value] of Object.entries(error as Record<string, unknown>)) {
    const message = Array.isArray(value) ? value.filter((item) => typeof item === "string").join(" ") : value;
    if (typeof message === "string" && message) result[field] = message;
  }
  return result;
}

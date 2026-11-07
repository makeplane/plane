/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type {
  TAgentAccountProvider,
  TAgentAdapter,
  TAgentCredentialMethod,
  TAgentPermissionLevel,
  TAgentProvider,
} from "@plane/types";

/** Permission levels (ACP session modes), least to most permissive. The order is the rank. */
export const AGENT_PERMISSION_LEVELS: readonly TAgentPermissionLevel[] = ["ask_all", "ask_writes", "yolo"];

/** Rank of a permission level; -1 for an unknown id (e.g. a mode a third-party agent defines). */
export const getAgentPermissionRank = (level: string): number =>
  AGENT_PERMISSION_LEVELS.indexOf(level as TAgentPermissionLevel);

export const AGENT_ADAPTERS: readonly TAgentAdapter[] = ["claude", "codex", "gemini", "deepseek"];

/** The placeholder the admin API returns for every stored env value. Sending it back keeps the value. */
export const AGENT_ENV_MASK = "********";

/** Env keys must look like `UPPER_SNAKE` (the API enforces the same pattern). */
export const AGENT_ENV_KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/;

export type TAgentEnvField = {
  key: string;
  /** Rendered as a password field. Every value is write-only either way. */
  secret: boolean;
  /** Fields sharing a group are alternatives: at least one of them must be set. */
  requiredGroup?: string;
  /**
   * The instance-wide fallback for a provider credential members and workspaces set themselves.
   * The form tucks these away, since most agents don't need them.
   */
  fallback?: boolean;
};

/**
 * Credentials and settings each adapter reads from its env (see `packages/acp-adapters/README.md`).
 * A provider's credential here is only the fallback: a member's own credential, then the
 * workspace's key, come first (see `apps/api/plane/utils/agent_credentials.py`). DeepSeek has no
 * member or workspace credentials, so its key is required.
 */
export const AGENT_ADAPTER_ENV_FIELDS: Record<TAgentAdapter, readonly TAgentEnvField[]> = {
  claude: [
    { key: "ANTHROPIC_API_KEY", secret: true, fallback: true },
    { key: "CLAUDE_CODE_OAUTH_TOKEN", secret: true, fallback: true },
  ],
  codex: [
    { key: "OPENAI_API_KEY", secret: true, fallback: true },
    { key: "PLANE_AGENT_AUTH", secret: false, fallback: true },
  ],
  gemini: [
    { key: "GEMINI_API_KEY", secret: true, fallback: true },
    { key: "PLANE_AGENT_AUTH", secret: false, fallback: true },
  ],
  deepseek: [
    { key: "DEEPSEEK_API_KEY", secret: true, requiredGroup: "deepseek_auth" },
    { key: "DEEPSEEK_BASE_URL", secret: false },
  ],
};

/** The env key holding an agent's default model id. */
export const AGENT_MODEL_ENV_KEY = "PLANE_AGENT_MODEL";

/** Env every adapter reads. */
export const AGENT_COMMON_ENV_FIELDS: readonly TAgentEnvField[] = [
  { key: AGENT_MODEL_ENV_KEY, secret: false },
  { key: "PLANE_AGENT_EFFORT", secret: false },
];

export type TAgentModelOption = { value: string; name: string };

/**
 * The models the admin form offers as an agent's default, mirroring the adapters' built-in lists
 * (`CLAUDE_MODELS`, `DEEPSEEK_MODELS` in `packages/acp-adapters`). Codex and Gemini list their
 * models at run time from the provider's CLI, so the form takes a custom id for them.
 */
export const AGENT_ADAPTER_MODELS: Record<TAgentAdapter, readonly TAgentModelOption[]> = {
  claude: [
    { value: "claude-opus-5-5", name: "Claude Opus 5.5" },
    { value: "claude-sonnet-5-5", name: "Claude Sonnet 5.5" },
    { value: "claude-haiku-5-5", name: "Claude Haiku 5.5" },
    { value: "claude-fable-5-1", name: "Claude Fable 5.1" },
  ],
  codex: [],
  gemini: [],
  deepseek: [
    { value: "deepseek-v4-pro", name: "DeepSeek V4 Pro" },
    { value: "deepseek-flash", name: "DeepSeek Flash" },
  ],
};

/** AI providers members can add credentials for, in the order the settings page shows them. */
export const AGENT_PROVIDERS: readonly TAgentProvider[] = ["anthropic", "openai", "google"];

/** The adapter whose agents use each provider's credential. */
export const AGENT_PROVIDER_ADAPTERS: Record<TAgentProvider, TAgentAdapter> = {
  anthropic: "claude",
  openai: "codex",
  google: "gemini",
};

/** The account sign-in a provider offers (personal only); Anthropic is API key only. */
export const AGENT_PROVIDER_ACCOUNT_METHODS: Partial<Record<TAgentProvider, TAgentCredentialMethod>> = {
  openai: "chatgpt",
  google: "google_account",
};

export const isAgentAccountProvider = (provider: TAgentProvider): provider is TAgentAccountProvider =>
  provider in AGENT_PROVIDER_ACCOUNT_METHODS;

/** API key rules the API enforces: 8–512 characters, no whitespace. */
export const AGENT_PROVIDER_API_KEY_MIN_LENGTH = 8;
export const AGENT_PROVIDER_API_KEY_MAX_LENGTH = 512;

/** How often the ChatGPT device-code dialog asks the bridge whether the sign-in finished. */
export const AGENT_CONNECTION_POLL_INTERVAL_MS = 3000;

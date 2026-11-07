/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** First-party ACP adapters an instance admin can register (the runner maps each to a fixed bin). */
export type TAgentAdapter = "claude" | "codex" | "deepseek" | "gemini";

/** ACP session modes used as permission levels, least to most permissive. */
export type TAgentPermissionLevel = "ask_all" | "ask_writes" | "yolo";

/** The fields of an agent definition every API returns. */
export type TAgentDefinitionBase = {
  id: string;
  name: string;
  slug: string;
  description: string;
  adapter: TAgentAdapter;
  default_permission_level: TAgentPermissionLevel;
  max_permission_level: TAgentPermissionLevel;
};

/**
 * Where a member's chats with an agent get their credential: their own, the workspace's key, the
 * agent's admin env, or `null` when nothing would sign the chat in.
 */
export type TAgentCredentialSource = "personal" | "workspace" | "instance";

/** An agent a workspace member can chat with (`GET /api/workspaces/<slug>/agents/`). */
export type TWorkspaceAgent = TAgentDefinitionBase & {
  credential_source: TAgentCredentialSource | null;
};

/**
 * An agent definition as the instance admin API returns it. `env` values are always the mask
 * (`AGENT_ENV_MASK`); the secrets themselves are write-only.
 */
export type TInstanceAgent = TAgentDefinitionBase & {
  env: Record<string, string>;
  /** The stored env could not be decrypted (e.g. the secret key changed); every value must be re-entered. */
  env_decryption_failed: boolean;
  attach_plane_mcp: boolean;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

/**
 * Create/update payload. `env`, when sent, is the complete desired set: keys left out are removed and
 * a value equal to the mask keeps the stored one. Omit `env` to leave it untouched.
 */
export type TInstanceAgentPayload = Partial<
  Pick<
    TInstanceAgent,
    | "name"
    | "slug"
    | "description"
    | "adapter"
    | "env"
    | "default_permission_level"
    | "max_permission_level"
    | "attach_plane_mcp"
    | "is_enabled"
    | "sort_order"
  >
>;

/** AI providers a member or workspace admin can add credentials for (Workspace settings → AI providers). */
export type TAgentProvider = "anthropic" | "openai" | "google";

/** How a credential signs the agent in. Account sign-ins are personal only. */
export type TAgentCredentialMethod = "api_key" | "chatgpt" | "google_account";

/** Providers that offer an account sign-in through the agent bridge. */
export type TAgentAccountProvider = "openai" | "google";

/** The caller's own credential for a provider. Secrets are never returned, only the last 4 characters of a key. */
export type TAgentProviderPersonalCredential = {
  method: TAgentCredentialMethod;
  /** Last 4 characters of the key (`api_key` only). */
  secret_hint: string | null;
  /** The signed-in account's email (account methods only). */
  account_label: string | null;
  updated_at: string;
};

/** The workspace-shared key for a provider (always `api_key`). */
export type TAgentProviderWorkspaceCredential = {
  method: TAgentCredentialMethod;
  secret_hint: string | null;
  updated_at: string;
};

/** One provider as `GET /api/workspaces/<slug>/agent-providers/` returns it. */
export type TAgentProviderEntry = {
  provider: TAgentProvider;
  personal: TAgentProviderPersonalCredential | null;
  workspace: TAgentProviderWorkspaceCredential | null;
  /** Some enabled agent for this provider has a credential in the admin's env. */
  instance_configured: boolean;
  /** The caller is a workspace admin and may change the workspace key. */
  can_manage_workspace: boolean;
};

/** An account sign-in started through the bridge (`POST <bridge>/connections/<provider>/start`). */
export type TAgentConnectionStart = {
  loginId: string;
  /** Where the member signs in. */
  verificationUrl: string;
  /** The code to enter on the sign-in page (device-code flows, e.g. ChatGPT). */
  userCode?: string;
  /** The sign-in page shows a code the member pastes back (e.g. Google). */
  needsCode: boolean;
};

export type TAgentConnectionAccount = {
  email?: string;
  plan?: string;
};

/** The state of an account sign-in (`GET …/status`, `POST …/complete`). */
export type TAgentConnectionStatus = {
  status: "pending" | "connected" | "failed";
  account?: TAgentConnectionAccount;
  error?: string;
};

/**
 * Whether a member's stored account sign-in is still on the agent runner. When it is not, the
 * bridge has already removed the stale credential.
 */
export type TAgentConnectionAccountCheck = {
  connected: boolean;
  account?: TAgentConnectionAccount;
};

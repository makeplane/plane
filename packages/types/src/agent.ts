/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** First-party ACP adapters an instance admin can register (the runner maps each to a fixed bin). */
export type TAgentAdapter = "claude" | "codex" | "deepseek";

/** ACP session modes used as permission levels, least to most permissive. */
export type TAgentPermissionLevel = "ask_all" | "ask_writes" | "yolo";

/** An agent a workspace member can chat with (`GET /api/workspaces/<slug>/agents/`). */
export type TWorkspaceAgent = {
  id: string;
  name: string;
  slug: string;
  description: string;
  adapter: TAgentAdapter;
  default_permission_level: TAgentPermissionLevel;
  max_permission_level: TAgentPermissionLevel;
};

/**
 * An agent definition as the instance admin API returns it. `env` values are always the mask
 * (`AGENT_ENV_MASK`); the secrets themselves are write-only.
 */
export type TInstanceAgent = TWorkspaceAgent & {
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

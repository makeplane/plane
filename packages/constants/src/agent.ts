/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TAgentAdapter, TAgentPermissionLevel } from "@plane/types";

/** Permission levels (ACP session modes), least to most permissive. The order is the rank. */
export const AGENT_PERMISSION_LEVELS: readonly TAgentPermissionLevel[] = ["ask_all", "ask_writes", "yolo"];

/** Rank of a permission level; -1 for an unknown id (e.g. a mode a third-party agent defines). */
export const getAgentPermissionRank = (level: string): number =>
  AGENT_PERMISSION_LEVELS.indexOf(level as TAgentPermissionLevel);

export const AGENT_ADAPTERS: readonly TAgentAdapter[] = ["claude", "codex", "deepseek"];

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
};

/** Credentials and settings each adapter reads from its env (see `packages/acp-adapters/README.md`). */
export const AGENT_ADAPTER_ENV_FIELDS: Record<TAgentAdapter, readonly TAgentEnvField[]> = {
  claude: [
    { key: "ANTHROPIC_API_KEY", secret: true, requiredGroup: "claude_auth" },
    { key: "CLAUDE_CODE_OAUTH_TOKEN", secret: true, requiredGroup: "claude_auth" },
  ],
  codex: [{ key: "OPENAI_API_KEY", secret: true }],
  deepseek: [
    { key: "DEEPSEEK_API_KEY", secret: true, requiredGroup: "deepseek_auth" },
    { key: "DEEPSEEK_BASE_URL", secret: false },
  ],
};

/** Env every adapter reads. */
export const AGENT_COMMON_ENV_FIELDS: readonly TAgentEnvField[] = [{ key: "PLANE_AGENT_MODEL", secret: false }];

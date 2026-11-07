/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export { createAgent, MODEL_CONFIG_ID } from "./core/agent.ts";
export type {
  AdapterSession,
  AgentAdapter,
  AgentRuntime,
  ModelCatalog,
  ModelChoice,
  SessionHost,
  SessionInit,
  TurnContext,
} from "./core/agent.ts";
export { runStdioAgent, sequencedStream } from "./core/stdio.ts";
export {
  DEFAULT_PERMISSION_MODE,
  INITIAL_MODE_ENV,
  INITIAL_MODE_META_KEY,
  PERMISSION_MODE_IDS,
  classifyMcpCall,
  isPermissionModeId,
  requiresPermission,
  sessionModeState,
} from "./core/modes.ts";
export type { PermissionModeId, ToolCategory } from "./core/modes.ts";
export { PERMISSION_OPTIONS, PermissionGate } from "./core/permission.ts";
export { toClaudeMcpServers, toCodexMcpServers } from "./core/mcp.ts";
export { MODEL_ENV } from "./core/models.ts";
export { createClaudeAdapter, CLAUDE_ENV, CLAUDE_MODELS } from "./claude/index.ts";
export { AGENT_AUTH_ENV, AGENT_AUTH_MODES, AI_PROVIDERS_SETTINGS } from "./core/auth.ts";
export {
  createCodexAdapter,
  CODEX_ENV,
  CHATGPT_NOT_CONNECTED,
  approvalPolicyFor,
  resolveCodexAuth,
} from "./codex/index.ts";
export { createDeepSeekAdapter, DEEPSEEK_ENV, DEEPSEEK_MODELS } from "./deepseek/index.ts";
export { echoAdapter, echoSessionIds } from "./echo/index.ts";
export {
  createGeminiAdapter,
  GEMINI_CLI_VERSION,
  GEMINI_ENV,
  GOOGLE_NOT_CONNECTED,
  resolveGeminiAuth,
} from "./gemini/index.ts";
export { geminiPolicyPath, geminiSystemSettingsPath } from "./gemini/files.ts";

/** Fixed adapter → bin mapping the runner uses; admins pick an adapter, never a command. */
export const ADAPTER_BINS = {
  claude: "plane-acp-claude",
  codex: "plane-acp-codex",
  deepseek: "plane-acp-deepseek",
  echo: "plane-acp-echo",
  gemini: "plane-acp-gemini",
} as const;

/** The provider sign-in helper the runner starts as `<bin> <codex|gemini> <start|logout|status>`. */
export const LOGIN_BIN = "plane-agent-login";

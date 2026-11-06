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
export { createCodexAdapter, CODEX_ENV, approvalPolicyFor } from "./codex/index.ts";
export { createDeepSeekAdapter, DEEPSEEK_ENV, DEEPSEEK_MODELS } from "./deepseek/index.ts";
export { echoAdapter, echoSessionIds } from "./echo/index.ts";

/** Fixed adapter → bin mapping the runner uses; admins pick an adapter, never a command. */
export const ADAPTER_BINS = {
  claude: "plane-acp-claude",
  codex: "plane-acp-codex",
  deepseek: "plane-acp-deepseek",
  echo: "plane-acp-echo",
} as const;

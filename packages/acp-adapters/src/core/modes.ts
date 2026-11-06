import type { SessionModeState, ToolKind } from "@agentclientprotocol/sdk";

import { objectValue, stringValue } from "./json.ts";

/**
 * Permission levels, exposed as ACP session modes. Ordered least to most permissive; the
 * bridge relies on this order to enforce the admin maximum, so never reorder it.
 */
export const PERMISSION_MODE_IDS = ["ask_all", "ask_writes", "yolo"] as const;
export type PermissionModeId = (typeof PERMISSION_MODE_IDS)[number];

export const DEFAULT_PERMISSION_MODE: PermissionModeId = "ask_writes";

/** `session/new` `_meta` key the bridge uses to pick the starting mode. */
export const INITIAL_MODE_META_KEY = "plane/initialModeId";
/** Fallback starting mode when the bridge sends none (set by the runner from the agent config). */
export const INITIAL_MODE_ENV = "PLANE_AGENT_DEFAULT_MODE";

const MODE_DESCRIPTIONS: Record<PermissionModeId, { name: string; description: string }> = {
  ask_all: { name: "Ask every time", description: "Ask before every tool call, including reads." },
  ask_writes: {
    name: "Ask before changes",
    description: "Reads, search and web fetches run freely; shell commands, file writes and Plane changes ask first.",
  },
  yolo: { name: "Never ask", description: "Run every tool without asking." },
};

export function isPermissionModeId(value: unknown): value is PermissionModeId {
  return typeof value === "string" && (PERMISSION_MODE_IDS as readonly string[]).includes(value);
}

export function sessionModeState(currentModeId: PermissionModeId): SessionModeState {
  return {
    currentModeId,
    availableModes: PERMISSION_MODE_IDS.map((id) => Object.assign({ id }, MODE_DESCRIPTIONS[id])),
  };
}

/** Resolve the starting mode: `_meta` from the bridge, then the env default, then `ask_writes`. */
export function initialModeId(meta: unknown, env: NodeJS.ProcessEnv): PermissionModeId {
  const requested = objectValue(meta)[INITIAL_MODE_META_KEY];
  if (isPermissionModeId(requested)) return requested;
  const fromEnv = env[INITIAL_MODE_ENV];
  return isPermissionModeId(fromEnv) ? fromEnv : DEFAULT_PERMISSION_MODE;
}

/**
 * What a tool call does, as far as the permission gate is concerned. Adapters classify their
 * native tools into one of these; MCP calls go through {@link classifyMcpCall}.
 */
export type ToolCategory =
  | "read"
  | "search"
  | "fetch"
  | "think"
  | "execute"
  | "edit"
  | "delete"
  | "move"
  | "mcp_read"
  | "mcp_write"
  | "other";

const FREE_IN_ASK_WRITES: ReadonlySet<ToolCategory> = new Set(["read", "search", "fetch", "think", "mcp_read"]);

/** The mode gate: does this category need a `session/request_permission` round trip in `mode`? */
export function requiresPermission(mode: PermissionModeId, category: ToolCategory): boolean {
  if (mode === "yolo") return false;
  if (mode === "ask_all") return true;
  return !FREE_IN_ASK_WRITES.has(category);
}

export function toolKindForCategory(category: ToolCategory): ToolKind {
  switch (category) {
    case "read":
    case "mcp_read":
      return "read";
    case "search":
      return "search";
    case "fetch":
      return "fetch";
    case "think":
      return "think";
    case "execute":
      return "execute";
    case "edit":
    case "mcp_write":
      return "edit";
    case "delete":
      return "delete";
    case "move":
      return "move";
    default:
      return "other";
  }
}

const READ_ACTION = /^(list|retrieve|get|search|count|read|fetch|find|query|resolve|describe|status|show|view)(_|$)/;
const READ_TOOL_NAME = /^(list|retrieve|get|search|count|read|fetch|find|query|describe|show|view)[_-]/;

/**
 * Classify an MCP tool call as a read or a mutation. Fails closed: anything not recognisably
 * read-only is a mutation.
 *
 * Order: an explicit `readOnlyHint` annotation, then the Plane MCP convention (one tool per
 * resource with an `action` argument such as `list`/`retrieve`/`create`), then a read-style tool
 * name such as `get_pql_reference`.
 */
export function classifyMcpCall(
  tool: string,
  input: unknown,
  annotations?: { readOnlyHint?: boolean | undefined } | undefined
): "mcp_read" | "mcp_write" {
  if (annotations?.readOnlyHint === true) return "mcp_read";
  const action = stringValue(objectValue(input).action).toLowerCase();
  if (action) return READ_ACTION.test(action) ? "mcp_read" : "mcp_write";
  return READ_TOOL_NAME.test(tool.toLowerCase()) ? "mcp_read" : "mcp_write";
}

/* oxlint-disable no-await-in-loop -- session updates and tool calls must reach the client in order */
import { randomUUID } from "node:crypto";
import path from "node:path";

import { RequestError, type PlanEntry, type StopReason, type ToolCallContent } from "@agentclientprotocol/sdk";
import {
  getSessionMessages as sdkGetSessionMessages,
  listSessions as sdkListSessions,
  query as sdkQuery,
  type CanUseTool,
  type HookCallback,
  type HookJSONOutput,
  type Options,
  type PermissionMode,
  type Query,
  type SDKMessage,
} from "@anthropic-ai/claude-agent-sdk";

import type { AdapterSession, AgentAdapter, SessionHost, SessionInit, TurnContext } from "../core/agent.ts";
import { agentInfo, PACKAGE_VERSION } from "../core/info.ts";
import { arrayValue, numberValue, objectValue, stringValue, type JsonObject } from "../core/json.ts";
import { toClaudeMcpServers } from "../core/mcp.ts";
import { modelCatalog } from "../core/models.ts";
import { classifyMcpCall, toolKindForCategory, type PermissionModeId, type ToolCategory } from "../core/modes.ts";
import type { PermissionDecision } from "../core/permission.ts";
import { promptToText } from "../core/turn.ts";

export const CLAUDE_ENV = { apiKey: "ANTHROPIC_API_KEY", oauthToken: "CLAUDE_CODE_OAUTH_TOKEN" } as const;

export const CLAUDE_MODELS = [
  { value: "claude-opus-5-5", name: "Claude Opus 5.5" },
  { value: "claude-sonnet-5-5", name: "Claude Sonnet 5.5" },
  { value: "claude-haiku-5-5", name: "Claude Haiku 5.5" },
  { value: "claude-fable-5-1", name: "Claude Fable 5.1" },
] as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Permission level → Claude permission mode. The PreToolUse hook is the gate in every mode;
 * `bypassPermissions` in `yolo` only stops Claude Code from asking on its own.
 */
export function claudePermissionMode(mode: PermissionModeId): PermissionMode {
  return mode === "yolo" ? "bypassPermissions" : "default";
}

export interface ClaudeAdapterOptions {
  /** Injected in tests: a fake `query()` yielding canned SDK messages. */
  readonly query?: typeof sdkQuery;
  readonly getSessionMessages?: typeof sdkGetSessionMessages;
  readonly listSessions?: typeof sdkListSessions;
}

export function createClaudeAdapter(options: ClaudeAdapterOptions = {}): AgentAdapter {
  const deps = {
    query: options.query ?? sdkQuery,
    getSessionMessages: options.getSessionMessages ?? sdkGetSessionMessages,
    listSessions: options.listSessions ?? sdkListSessions,
  };
  const requireAuth = (env: NodeJS.ProcessEnv) => {
    if (!env[CLAUDE_ENV.apiKey]?.trim() && !env[CLAUDE_ENV.oauthToken]?.trim()) {
      throw RequestError.authRequired(undefined, `set ${CLAUDE_ENV.apiKey} or ${CLAUDE_ENV.oauthToken} for this agent`);
    }
  };
  return {
    info: agentInfo("plane-acp-claude", "Claude"),
    promptCapabilities: { image: false, audio: false, embeddedContext: true },
    models: (env) => modelCatalog(CLAUDE_MODELS, env),
    async startSession(init) {
      requireAuth(init.host.env);
      return new ClaudeSession(init, deps, false);
    },
    async loadSession(init) {
      requireAuth(init.host.env);
      const messages = await deps.getSessionMessages(init.host.sessionId, { dir: init.host.cwd }).catch(() => []);
      if (!messages.length) throw RequestError.resourceNotFound(init.host.sessionId);
      await replayHistory(init.host, messages);
      return new ClaudeSession(init, deps, true);
    },
    async listSessions(cwd) {
      const sessions = await deps.listSessions({ ...(cwd ? { dir: cwd } : {}), limit: 100 });
      return {
        sessions: sessions.map((session) => ({
          sessionId: session.sessionId,
          cwd: cwd ?? "",
          title: session.customTitle ?? session.summary,
          updatedAt: new Date(session.lastModified).toISOString(),
        })),
      };
    },
  };
}

interface ClaudeDeps {
  readonly query: typeof sdkQuery;
}

interface ToolDescription {
  readonly title: string;
  readonly category: ToolCategory;
  readonly locations?: { path: string }[];
  readonly memoryKey: string;
}

/** Title, gate category and "always allow" scope for a Claude Code tool call. */
export function describeClaudeTool(name: string, input: JsonObject, cwd: string): ToolDescription {
  const file = stringValue(input.file_path) || stringValue(input.notebook_path);
  const locations = file ? [{ path: path.resolve(cwd, file) }] : undefined;
  const withLocations = (description: Omit<ToolDescription, "locations">): ToolDescription =>
    locations ? { ...description, locations } : description;
  if (name.startsWith("mcp__")) {
    const [, server = "", ...rest] = name.split("__");
    const tool = rest.join("__");
    const action = stringValue(input.action);
    return {
      title: `${server}: ${tool}${action ? ` ${action}` : ""}`,
      category: classifyMcpCall(tool, input),
      memoryKey: `mcp:${server}:${tool}:${action}`,
    };
  }
  switch (name) {
    case "Read":
      return withLocations({ title: `Read ${file}`, category: "read", memoryKey: name });
    case "Write":
    case "Edit":
    case "MultiEdit":
    case "NotebookEdit":
      return withLocations({
        title: `${name === "Write" ? "Write" : "Edit"} ${file}`,
        category: "edit",
        memoryKey: name,
      });
    case "Bash": {
      const command = stringValue(input.command);
      return {
        title: `Run: ${command.slice(0, 120)}`,
        category: "execute",
        memoryKey: `Bash:${command.trim().split(/\s+/)[0] ?? ""}`,
      };
    }
    case "BashOutput":
      return { title: "Read shell output", category: "read", memoryKey: name };
    case "KillShell":
    case "KillBash":
      return { title: "Stop shell", category: "execute", memoryKey: name };
    case "Glob":
      return { title: `Find ${stringValue(input.pattern)}`, category: "search", memoryKey: name };
    case "Grep":
      return { title: `Search "${stringValue(input.pattern)}"`, category: "search", memoryKey: name };
    case "LS":
      return { title: `List ${stringValue(input.path)}`, category: "search", memoryKey: name };
    case "WebFetch":
      return { title: `Fetch ${stringValue(input.url)}`, category: "fetch", memoryKey: name };
    case "WebSearch":
      return { title: `Search the web: ${stringValue(input.query)}`, category: "fetch", memoryKey: name };
    case "Task":
    case "Agent":
      return { title: `Agent: ${stringValue(input.description) || "subtask"}`, category: "think", memoryKey: name };
    case "TodoWrite":
    case "ExitPlanMode":
    case "EnterPlanMode":
      return { title: name, category: "think", memoryKey: name };
    default:
      return { title: name, category: "other", memoryKey: name };
  }
}

/** TodoWrite only updates the task list, so it is shown as a `plan` and never gated. */
const PLAN_TOOL = "TodoWrite";

class ClaudeSession implements AdapterSession {
  readonly #host: SessionHost;
  readonly #mcpServers: ReturnType<typeof toClaudeMcpServers>;
  readonly #deps: ClaudeDeps;
  #claudeSessionId: string;
  #started: boolean;
  #active: Query | undefined;

  constructor(init: SessionInit, deps: ClaudeDeps, resumed: boolean) {
    this.#host = init.host;
    this.#mcpServers = toClaudeMcpServers(init.mcpServers);
    this.#deps = deps;
    this.#claudeSessionId = UUID.test(init.host.sessionId) ? init.host.sessionId : randomUUID();
    this.#started = resumed;
  }

  async setMode(mode: PermissionModeId): Promise<void> {
    await this.#active?.setPermissionMode(claudePermissionMode(mode)).catch(() => {});
  }

  async setModel(model: string): Promise<void> {
    await this.#active?.setModel(model).catch(() => {});
  }

  async prompt(turn: TurnContext): Promise<StopReason> {
    const host = this.#host;
    const abortController = new AbortController();
    const onAbort = () => abortController.abort();
    turn.signal.addEventListener("abort", onAbort, { once: true });
    const decisions = new Map<string, Promise<PermissionDecision>>();
    const planToolIds = new Set<string>();

    /** One gate decision per tool use, shared by the hook and `canUseTool`. */
    const decide = (toolUseId: string, name: string, input: JsonObject): Promise<PermissionDecision> => {
      if (name === PLAN_TOOL) return Promise.resolve("allowed");
      let decision = decisions.get(toolUseId);
      if (!decision) {
        decision = (async () => {
          const tool = describeClaudeTool(name, input, host.cwd);
          const kind = toolKindForCategory(tool.category);
          const toolCallId = await host.toolCalls.start(toolUseId, {
            title: tool.title,
            kind,
            rawInput: input,
            ...(tool.locations ? { locations: tool.locations } : {}),
          });
          return host.gate.check(
            {
              toolCallId,
              title: tool.title,
              kind,
              category: tool.category,
              rawInput: input,
              memoryKey: tool.memoryKey,
            },
            turn.signal
          );
        })();
        decisions.set(toolUseId, decision);
      }
      return decision;
    };

    const preToolUse: HookCallback = async (input) => {
      if (input.hook_event_name !== "PreToolUse") return {};
      const decision = await decide(input.tool_use_id, input.tool_name, objectValue(input.tool_input));
      return hookOutput(decision);
    };
    const canUseTool: CanUseTool = async (name, input, { toolUseID }) => {
      const decision = await decide(toolUseID, name, input);
      return decision === "allowed"
        ? { behavior: "allow", updatedInput: input }
        : { behavior: "deny", message: denyMessage(decision), interrupt: decision === "cancelled" };
    };

    const options: Options = {
      cwd: host.cwd,
      model: host.model(),
      abortController,
      includePartialMessages: true,
      mcpServers: this.#mcpServers,
      permissionMode: claudePermissionMode(host.mode()),
      allowDangerouslySkipPermissions: true,
      canUseTool,
      hooks: { PreToolUse: [{ hooks: [preToolUse] }] },
      // Isolation mode: no user/project settings files, so nothing on disk can add hooks or
      // permission rules that bypass the gate.
      settingSources: [],
      systemPrompt: { type: "preset", preset: "claude_code", append: PLANE_INSTRUCTIONS },
      env: {
        ...host.env,
        // Claude Code strips Anthropic and cloud credentials from Bash, hooks and stdio MCP servers.
        CLAUDE_CODE_SUBPROCESS_ENV_SCRUB: "1",
        CLAUDE_AGENT_SDK_CLIENT_APP: `plane-acp-claude/${PACKAGE_VERSION}`,
      },
      ...(this.#started ? { resume: this.#claudeSessionId } : { sessionId: this.#claudeSessionId }),
    };

    const streamed = new Set<string>();
    let stopReason: StopReason = "end_turn";
    const activeQuery = this.#deps.query({ prompt: promptToText(turn.prompt), options });
    this.#active = activeQuery;
    try {
      for await (const message of activeQuery) {
        const result = await this.#handle(message, turn, streamed, planToolIds);
        if (result) stopReason = result;
      }
      this.#started = true;
      return turn.signal.aborted ? "cancelled" : stopReason;
    } catch (error) {
      if (turn.signal.aborted) return "cancelled";
      throw error;
    } finally {
      this.#started = true;
      this.#active = undefined;
      turn.signal.removeEventListener("abort", onAbort);
    }
  }

  async close(): Promise<void> {
    this.#active?.close();
  }

  async #handle(
    message: SDKMessage,
    turn: TurnContext,
    streamed: Set<string>,
    planToolIds: Set<string>
  ): Promise<StopReason | undefined> {
    const host = this.#host;
    const { messages } = turn;
    switch (message.type) {
      case "system":
        if (message.subtype === "init" && message.session_id) this.#claudeSessionId = message.session_id;
        return undefined;
      case "stream_event": {
        if (message.parent_tool_use_id !== null) return undefined;
        const event = message.event;
        if (event.type === "message_start") {
          streamed.add(event.message.id);
          messages.breakMessage();
        } else if (event.type === "content_block_start" && event.content_block.type === "tool_use") {
          const block = event.content_block;
          if (block.name !== PLAN_TOOL) {
            // The input streams in later; the assistant message fills in the real title.
            const tool = describeClaudeTool(block.name, {}, host.cwd);
            messages.breakMessage();
            await host.toolCalls.start(block.id, { title: block.name, kind: toolKindForCategory(tool.category) });
          }
        } else if (event.type === "content_block_delta") {
          if (event.delta.type === "text_delta") await messages.text(event.delta.text);
          else if (event.delta.type === "thinking_delta") await messages.thought(event.delta.thinking);
        }
        return undefined;
      }
      case "assistant": {
        const topLevel = message.parent_tool_use_id === null;
        const alreadyStreamed = streamed.has(message.message.id);
        for (const block of message.message.content) {
          if (block.type === "text" && topLevel && !alreadyStreamed) await messages.text(block.text);
          else if (block.type === "thinking" && topLevel && !alreadyStreamed) await messages.thought(block.thinking);
          else if (block.type === "tool_use") {
            const input = objectValue(block.input);
            if (block.name === PLAN_TOOL) {
              planToolIds.add(block.id);
              await host.emit({ sessionUpdate: "plan", entries: todosToPlan(input.todos) });
              continue;
            }
            const tool = describeClaudeTool(block.name, input, host.cwd);
            messages.breakMessage();
            await host.toolCalls.start(block.id, {
              title: tool.title,
              kind: toolKindForCategory(tool.category),
              rawInput: input,
              ...(tool.locations ? { locations: tool.locations } : {}),
            });
          }
        }
        return undefined;
      }
      case "user": {
        const content = message.message.content;
        if (typeof content === "string") return undefined;
        for (const block of content) {
          if (block.type !== "tool_result" || planToolIds.has(block.tool_use_id)) continue;
          if (!host.toolCalls.has(block.tool_use_id)) continue;
          const toolCallId = host.toolCalls.idFor(block.tool_use_id);
          await host.toolCalls.update(toolCallId, {
            status: block.is_error ? "failed" : "completed",
            content: toolResultContent(block.content),
            ...(message.tool_use_result === undefined ? {} : { rawOutput: message.tool_use_result }),
          });
        }
        return undefined;
      }
      case "result": {
        const usage = objectValue(message.usage);
        const modelUsage = objectValue(objectValue(message.modelUsage)[host.model()]);
        const used =
          (numberValue(usage.input_tokens) ?? 0) +
          (numberValue(usage.cache_read_input_tokens) ?? 0) +
          (numberValue(usage.cache_creation_input_tokens) ?? 0) +
          (numberValue(usage.output_tokens) ?? 0);
        const size = numberValue(modelUsage.contextWindow) ?? 1_000_000;
        await host.emit({
          sessionUpdate: "usage_update",
          used,
          size,
          ...(Number.isFinite(message.total_cost_usd)
            ? { cost: { amount: message.total_cost_usd, currency: "USD" } }
            : {}),
        });
        if (message.subtype === "success") {
          if (message.is_error) throw new Error(message.result || "Claude returned an error");
          if (message.stop_reason === "max_tokens") return "max_tokens";
          if (message.stop_reason === "refusal") return "refusal";
          return "end_turn";
        }
        if (turn.signal.aborted) return "cancelled";
        if (message.subtype === "error_max_turns") return "max_turn_requests";
        throw new Error(message.errors.join("; ") || `Claude stopped: ${message.subtype}`);
      }
      default:
        return undefined;
    }
  }
}

function hookOutput(decision: PermissionDecision): HookJSONOutput {
  if (decision === "allowed")
    return { hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "allow" } };
  return {
    ...(decision === "cancelled" ? { continue: false } : {}),
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: denyMessage(decision),
    },
  };
}

function denyMessage(decision: PermissionDecision): string {
  return decision === "cancelled" ? "The user cancelled the turn." : "The user denied this tool call. Do not retry it.";
}

function todosToPlan(value: unknown): PlanEntry[] {
  return arrayValue(value).map((entry) => {
    const todo = objectValue(entry);
    const status = stringValue(todo.status);
    return {
      content: stringValue(todo.content),
      priority: "medium",
      status: status === "completed" || status === "in_progress" ? status : "pending",
    };
  });
}

function toolResultContent(value: unknown): ToolCallContent[] {
  const text =
    typeof value === "string"
      ? value
      : arrayValue(value)
          .map(objectValue)
          .map((block) => (block.type === "text" ? stringValue(block.text) : `[${stringValue(block.type)}]`))
          .join("\n");
  return text ? [{ type: "content", content: { type: "text", text } }] : [];
}

/** Replay a stored Claude session as ACP updates for `session/load`. */
async function replayHistory(
  host: SessionHost,
  messages: readonly { type: string; message: unknown; parent_tool_use_id: string | null }[]
): Promise<void> {
  let seq = 0;
  for (const entry of messages) {
    if (entry.parent_tool_use_id !== null) continue;
    const message = objectValue(entry.message);
    const content =
      typeof message.content === "string" ? [{ type: "text", text: message.content }] : arrayValue(message.content);
    const messageId = `h-${++seq}`;
    for (const value of content) {
      const block = objectValue(value);
      if (block.type === "text" && stringValue(block.text)) {
        await host.emit({
          sessionUpdate: entry.type === "user" ? "user_message_chunk" : "agent_message_chunk",
          content: { type: "text", text: stringValue(block.text) },
          messageId,
        });
      } else if (block.type === "tool_use" && entry.type === "assistant" && stringValue(block.name) !== PLAN_TOOL) {
        const input = objectValue(block.input);
        const tool = describeClaudeTool(stringValue(block.name), input, host.cwd);
        await host.toolCalls.start(stringValue(block.id), {
          title: tool.title,
          kind: toolKindForCategory(tool.category),
          status: "completed",
          rawInput: input,
        });
      }
    }
  }
}

const PLANE_INSTRUCTIONS = [
  "You are running inside Plane, a project management tool, as an agent the user chats with.",
  "Your working directory persists between conversations.",
  "Tools from the `plane` MCP server read and change the user's Plane workspace as that user.",
  "Some tool calls need the user's approval; if one is denied, do not retry it.",
].join("\n");

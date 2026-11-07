/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* oxlint-disable no-await-in-loop -- session updates and tool calls must reach the client in order */
import { RequestError, type StopReason } from "@agentclientprotocol/sdk";

import { abortable } from "../core/abort.ts";
import type {
  AdapterSession,
  AgentAdapter,
  ModelChoice,
  SessionHost,
  SessionInit,
  TurnContext,
} from "../core/agent.ts";
import { scrubSecrets } from "../core/env.ts";
import { agentInfo } from "../core/info.ts";
import {
  arrayValue,
  errorMessage,
  numberValue,
  objectValue,
  parseJsonObject,
  stringValue,
  type JsonObject,
} from "../core/json.ts";
import { classifyMcpCall, toolKindForCategory, type ToolCategory } from "../core/modes.ts";
import { effortChoices, modelCatalog } from "../core/models.ts";
import { promptToText } from "../core/turn.ts";
import { McpHub, type McpToolBinding } from "./mcp-hub.ts";
import { chatSseEvents } from "./sse.ts";
import { BUILTIN_TOOLS, type BuiltinTool, type ToolResult } from "./tools.ts";

/** Env the runner passes from the agent config. */
export const DEEPSEEK_ENV = {
  apiKey: "DEEPSEEK_API_KEY",
  baseUrl: "DEEPSEEK_BASE_URL",
  maxIterations: "PLANE_AGENT_MAX_ITERATIONS",
  reasoningEffort: "DEEPSEEK_REASONING_EFFORT",
} as const;

export const DEEPSEEK_DEFAULT_BASE_URL = "https://api.deepseek.com";
/** `reasoning_effort` levels, lowest first. */
export const DEEPSEEK_EFFORTS = ["low", "high", "max"] as const;
const DEEPSEEK_EFFORT_CHOICES = effortChoices(DEEPSEEK_EFFORTS);
const DEEPSEEK_DEFAULT_EFFORT = "high";
const DEEPSEEK_MODEL_NAMES = [
  ["deepseek-v4-pro", "DeepSeek V4 Pro"],
  ["deepseek-flash", "DeepSeek Flash"],
] as const;

/** The models, starting on `DEEPSEEK_REASONING_EFFORT` when it is a level they take. */
export function deepseekModels(env: NodeJS.ProcessEnv): readonly ModelChoice[] {
  const configured = env[DEEPSEEK_ENV.reasoningEffort]?.trim() ?? "";
  const defaultEffort = DEEPSEEK_EFFORT_CHOICES.some((choice) => choice.value === configured)
    ? configured
    : DEEPSEEK_DEFAULT_EFFORT;
  return DEEPSEEK_MODEL_NAMES.map(([value, name]) => ({
    value,
    name,
    efforts: DEEPSEEK_EFFORT_CHOICES,
    defaultEffort,
  }));
}

export const DEEPSEEK_MODELS = deepseekModels({});
const DEFAULT_MAX_ITERATIONS = 50;
/** Both current DeepSeek models have a 1M-token context window. */
const CONTEXT_WINDOW = 1_000_000;

interface ChatToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; reasoning_content?: string; tool_calls?: ChatToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

/**
 * DeepSeek finish reasons to ACP stop reasons. `tool_calls` never reaches here: the loop continues.
 */
export function finishToStopReason(finish: string): StopReason {
  if (finish === "length") return "max_tokens";
  if (finish === "content_filter") return "refusal";
  return "end_turn";
}

export interface DeepSeekAdapterOptions {
  /** Injected in tests to stub the HTTP API. */
  readonly fetch?: typeof fetch;
}

export function createDeepSeekAdapter(options: DeepSeekAdapterOptions = {}): AgentAdapter {
  const fetchImpl = options.fetch ?? fetch;
  return {
    info: agentInfo("plane-acp-deepseek", "DeepSeek"),
    models: (env) => {
      const known = deepseekModels(env);
      return modelCatalog(known, env, {
        efforts: DEEPSEEK_EFFORT_CHOICES,
        defaultEffort: known[0]?.defaultEffort ?? DEEPSEEK_DEFAULT_EFFORT,
      });
    },
    async startSession(init) {
      const apiKey = init.host.env[DEEPSEEK_ENV.apiKey]?.trim();
      if (!apiKey) throw RequestError.authRequired(undefined, `${DEEPSEEK_ENV.apiKey} is not set for this agent`);
      const hub = await McpHub.connect(init.mcpServers, init.host.cwd);
      return new DeepSeekSession(init, hub, apiKey, fetchImpl);
    },
  };
}

class DeepSeekSession implements AdapterSession {
  readonly #host: SessionHost;
  readonly #hub: McpHub;
  readonly #apiKey: string;
  readonly #fetch: typeof fetch;
  readonly #messages: ChatMessage[];
  readonly #maxIterations: number;
  #pendingNotices: string[];

  constructor(init: SessionInit, hub: McpHub, apiKey: string, fetchImpl: typeof fetch) {
    this.#host = init.host;
    this.#hub = hub;
    this.#apiKey = apiKey;
    this.#fetch = fetchImpl;
    this.#messages = [{ role: "system", content: systemPrompt(init.host.cwd, hub.tools.length > 0) }];
    const configured = Number(init.host.env[DEEPSEEK_ENV.maxIterations]);
    this.#maxIterations = Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_MAX_ITERATIONS;
    // Notices wait for the first prompt: nothing may precede the `session/new` response.
    this.#pendingNotices = hub.failures.map((failure) => `MCP server unavailable: ${failure}`);
  }

  async prompt(turn: TurnContext): Promise<StopReason> {
    for (const title of this.#pendingNotices)
      await this.#host.emit({ sessionUpdate: "notice", severity: "warning", title });
    this.#pendingNotices = [];
    this.#messages.push({ role: "user", content: promptToText(turn.prompt) });

    for (let iteration = 0; iteration < this.#maxIterations; iteration += 1) {
      const step = await this.#complete(turn);
      if (step.cancelled) return "cancelled";
      if (!step.toolCalls.length) return finishToStopReason(step.finish);
      for (const [index, call] of step.toolCalls.entries()) {
        if (turn.signal.aborted) {
          this.#answerRemaining(step.toolCalls.slice(index), "cancelled by the user");
          return "cancelled";
        }
        const outcome = await this.#runToolCall(call, turn);
        this.#messages.push({ role: "tool", tool_call_id: call.id, content: outcome.text });
        if (outcome.cancelled) {
          this.#answerRemaining(step.toolCalls.slice(index + 1), "cancelled by the user");
          return "cancelled";
        }
      }
      turn.messages.breakMessage();
    }
    return "max_turn_requests";
  }

  async close(): Promise<void> {
    await this.#hub.close();
  }

  #answerRemaining(calls: readonly ChatToolCall[], text: string): void {
    for (const call of calls) this.#messages.push({ role: "tool", tool_call_id: call.id, content: text });
  }

  #tools(): JsonObject[] {
    return [
      ...BUILTIN_TOOLS.map((tool) => ({
        type: "function",
        function: { name: tool.name, description: tool.description, parameters: tool.parameters },
      })),
      ...this.#hub.tools.map((tool) => ({
        type: "function",
        function: {
          name: tool.functionName,
          description: `[MCP ${tool.server}] ${tool.description}`,
          parameters: tool.parameters,
        },
      })),
    ];
  }

  /** One streamed completion. The assistant message, reasoning included, is appended to history. */
  async #complete(turn: TurnContext): Promise<{ toolCalls: ChatToolCall[]; finish: string; cancelled: boolean }> {
    const env = this.#host.env;
    const effort = this.#host.effort();
    const body = {
      model: this.#host.model(),
      messages: this.#messages,
      tools: this.#tools(),
      stream: true,
      stream_options: { include_usage: true },
      thinking: { type: "enabled" },
      ...(effort ? { reasoning_effort: effort } : {}),
    };
    const baseUrl = (env[DEEPSEEK_ENV.baseUrl]?.trim() || DEEPSEEK_DEFAULT_BASE_URL).replace(/\/+$/, "");
    let content = "";
    let reasoning = "";
    let finish = "";
    const calls = new Map<number, { id: string; name: string; arguments: string }>();
    let usage: JsonObject | undefined;
    let cancelled = false;
    try {
      const response = await this.#fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.#apiKey}`,
          accept: "text/event-stream",
        },
        body: JSON.stringify(body),
        signal: turn.signal,
      });
      if (!response.ok) {
        const detail = (await response.text().catch(() => "")).slice(0, 500);
        const hint = response.status === 401 ? ` (check ${DEEPSEEK_ENV.apiKey})` : "";
        throw new Error(`DeepSeek API error ${response.status}${hint}: ${detail}`);
      }
      if (!response.body) throw new Error("DeepSeek returned an empty response body");
      for await (const event of chatSseEvents(response.body)) {
        const payload = objectValue(event);
        if (payload.usage) usage = objectValue(payload.usage);
        const choice = objectValue(arrayValue(payload.choices)[0]);
        const delta = objectValue(choice.delta);
        const thought = stringValue(delta.reasoning_content);
        if (thought) {
          reasoning += thought;
          await turn.messages.thought(thought);
        }
        const text = stringValue(delta.content);
        if (text) {
          content += text;
          await turn.messages.text(text);
        }
        for (const [fallbackIndex, value] of arrayValue(delta.tool_calls).entries()) {
          const record = objectValue(value);
          const fn = objectValue(record.function);
          const index = numberValue(record.index) ?? fallbackIndex;
          const current = calls.get(index) ?? { id: "", name: "", arguments: "" };
          calls.set(index, {
            id: stringValue(record.id) || current.id,
            name: current.name + stringValue(fn.name),
            arguments: current.arguments + stringValue(fn.arguments),
          });
        }
        finish = stringValue(choice.finish_reason) || finish;
      }
    } catch (error) {
      if (!turn.signal.aborted) throw error;
      cancelled = true;
    }

    const toolCalls: ChatToolCall[] = cancelled
      ? []
      : [...calls.entries()]
          .toSorted(([left], [right]) => left - right)
          .map(([index, call]) => ({
            id: call.id || `call_${this.#messages.length}_${index}`,
            type: "function" as const,
            function: { name: call.name, arguments: call.arguments },
          }));
    if (!cancelled || content || reasoning) {
      // DeepSeek's thinking mode with tools requires every earlier assistant turn's
      // `reasoning_content` in later requests (a 400 otherwise), so it is never dropped.
      this.#messages.push({
        role: "assistant",
        content: content || null,
        ...(reasoning ? { reasoning_content: reasoning } : {}),
        ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
      });
    }
    if (usage) {
      const used = (numberValue(usage.prompt_tokens) ?? 0) + (numberValue(usage.completion_tokens) ?? 0);
      await this.#host.emit({ sessionUpdate: "usage_update", used, size: CONTEXT_WINDOW });
    }
    return { toolCalls, finish, cancelled };
  }

  async #runToolCall(call: ChatToolCall, turn: TurnContext): Promise<{ text: string; cancelled: boolean }> {
    const host = this.#host;
    const name = call.function.name;
    const builtin = BUILTIN_TOOLS.find((tool) => tool.name === name);
    const mcp = builtin ? undefined : this.#hub.binding(name);
    const input = parseJsonObject(call.function.arguments);
    const validJson = !call.function.arguments.trim() || call.function.arguments.trim().startsWith("{");

    let category: ToolCategory;
    let title: string;
    let memoryKey: string;
    if (builtin) {
      category = builtin.category(input);
      title = builtin.title(input);
      // "Always allow" for the shell covers one program (e.g. `git`), not every command.
      memoryKey = builtin.name === "bash" ? `bash:${commandHead(input.command)}` : builtin.name;
    } else if (mcp) {
      category = classifyMcpCall(mcp.tool, input, { readOnlyHint: mcp.readOnlyHint });
      const action = stringValue(input.action);
      title = `${mcp.server}: ${mcp.tool}${action ? ` ${action}` : ""}`;
      memoryKey = `mcp:${mcp.server}:${mcp.tool}:${action}`;
    } else {
      category = "other";
      title = name || "unknown tool";
      memoryKey = title;
    }
    const kind = toolKindForCategory(category);
    turn.messages.breakMessage();
    const toolCallId = await host.toolCalls.start(call.id, {
      title,
      kind,
      rawInput: input,
      ...(builtin?.locations ? { locations: builtin.locations(input, host.cwd) } : {}),
    });

    if (!builtin && !mcp) return this.#finish(toolCallId, { text: `unknown tool ${name}`, isError: true });
    if (!validJson) return this.#finish(toolCallId, { text: "the tool arguments were not valid JSON", isError: true });

    const decision = await host.gate.check(
      { toolCallId, title, kind, category, rawInput: input, memoryKey },
      turn.signal
    );
    if (decision === "cancelled") {
      await host.toolCalls.update(toolCallId, { status: "failed", rawOutput: { error: "cancelled" } });
      return { text: "cancelled by the user", cancelled: true };
    }
    if (decision === "rejected")
      return this.#finish(toolCallId, { text: "The user denied this tool call.", isError: true });

    await host.toolCalls.update(toolCallId, { status: "in_progress" });
    let result: ToolResult;
    try {
      result = builtin
        ? await builtin.run(input, {
            cwd: host.cwd,
            env: scrubSecrets({ ...process.env, ...host.env }),
            signal: turn.signal,
            emit: host.emit,
            fetch: this.#fetch,
          })
        : await abortable(this.#hub.call(mcp as McpToolBinding, input, turn.signal), turn.signal);
    } catch (error) {
      if (turn.signal.aborted) {
        await host.toolCalls.update(toolCallId, { status: "failed", rawOutput: { error: "cancelled" } });
        return { text: "cancelled by the user", cancelled: true };
      }
      result = { text: errorMessage(error), isError: true };
    }
    return this.#finish(toolCallId, result, builtin);
  }

  async #finish(
    toolCallId: string,
    result: ToolResult,
    tool?: BuiltinTool
  ): Promise<{ text: string; cancelled: boolean }> {
    await this.#host.toolCalls.update(toolCallId, {
      status: result.isError ? "failed" : "completed",
      content: result.content ?? [{ type: "content", content: { type: "text", text: result.text } }],
      ...(tool?.name === "todo" ? {} : { rawOutput: { output: result.text } }),
    });
    return { text: result.text, cancelled: false };
  }
}

function commandHead(command: unknown): string {
  return stringValue(command).trim().split(/\s+/)[0] ?? "";
}

function systemPrompt(cwd: string, hasMcp: boolean): string {
  return [
    "You are an AI agent working for a user of Plane, a project management tool, from a chat inside Plane.",
    `Your working directory is ${cwd}. It persists between conversations; keep your files there.`,
    "Use the tools to inspect and change files, run commands and fetch web pages. Read a file before editing it.",
    hasMcp
      ? "Tools whose names start with mcp__ come from MCP servers; the Plane server reads and changes the user's Plane workspace (projects, work items, cycles, pages) as that user."
      : "",
    "Some tool calls need the user's approval. If one is denied, do not retry it; explain or take another approach.",
    "Use the todo tool to share a plan for multi-step work. Be concise.",
  ]
    .filter(Boolean)
    .join("\n");
}

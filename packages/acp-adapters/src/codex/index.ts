/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* oxlint-disable no-await-in-loop -- session updates and tool calls must reach the client in order */
import path from "node:path";

import { RequestError, type PlanEntry, type StopReason, type ToolCallContent } from "@agentclientprotocol/sdk";

import { deferred } from "../core/abort.ts";
import type {
  AdapterSession,
  AgentAdapter,
  ModelCatalog,
  ModelChoice,
  SessionHost,
  SessionInit,
  TurnContext,
} from "../core/agent.ts";
import { AI_PROVIDERS_SETTINGS, agentAuthMode, agentHome, ensurePrivateDir } from "../core/auth.ts";
import { SECRET_ENV_GLOBS } from "../core/env.ts";
import { agentInfo } from "../core/info.ts";
import { arrayValue, errorMessage, numberValue, objectValue, stringValue, type JsonObject } from "../core/json.ts";
import { toCodexMcpServers } from "../core/mcp.ts";
import { MODEL_ENV } from "../core/models.ts";
import { classifyMcpCall, toolKindForCategory, type PermissionModeId, type ToolCategory } from "../core/modes.ts";
import type { PermissionDecision } from "../core/permission.ts";
import { promptToText } from "../core/turn.ts";
import {
  CODEX_SIGNED_OUT,
  CodexAppServerClient,
  classifyCodexFailure,
  type CodexNotification,
  type CodexServerRequest,
  type SpawnCodexAppServer,
} from "./client.ts";

export const CODEX_ENV = {
  apiKey: "OPENAI_API_KEY",
  home: "CODEX_HOME",
  stallTimeoutMs: "PLANE_CODEX_STALL_TIMEOUT_MS",
  turnTimeoutMs: "PLANE_CODEX_TURN_TIMEOUT_MS",
} as const;

const DEFAULT_STALL_TIMEOUT_MS = 300_000;
const DEFAULT_TURN_TIMEOUT_MS = 30 * 60_000;
const INTERRUPT_GRACE_MS = 5_000;

/**
 * Codex approval policy per permission level. The runner is the sandbox, so threads always run
 * with `sandbox: danger-full-access`; the policy only decides what Codex asks about, and our gate
 * decides how to answer.
 *
 * - `ask_all`, `ask_writes` → `untrusted`: Codex asks before any command outside its read-only
 *   safe list and before file changes. The gate prompts for all of them in `ask_all`, and in
 *   `ask_writes` auto-accepts commands Codex parsed as pure reads/searches.
 * - `yolo` → `on-request`, not `never`: under `never` Codex refuses MCP tool calls that need
 *   approval instead of asking, and MCP servers are configured to always ask (so the mode can
 *   change mid-session). With full access Codex has no other reason to ask, and the gate accepts
 *   everything in `yolo`.
 */
export function approvalPolicyFor(mode: PermissionModeId): "untrusted" | "on-request" {
  return mode === "yolo" ? "on-request" : "untrusted";
}

export const CHATGPT_NOT_CONNECTED = `ChatGPT is not connected. Sign in with ChatGPT in ${AI_PROVIDERS_SETTINGS}.`;

/**
 * How the app-server signs in, from `PLANE_AGENT_AUTH` and the env:
 *
 * - `chatgpt`: the user's ChatGPT sign-in in `CODEX_HOME` (default `~/.codex`, written by the
 *   `plane-agent-login` helper). Never logs in with a key.
 * - `api_key` (or unset with `OPENAI_API_KEY`): a separate `CODEX_HOME` (default
 *   `~/.codex-api-key`) logged in with the current key on every start, so a changed key takes
 *   effect and a ChatGPT sign-in in `~/.codex` is never overwritten.
 * - `ambient`: neither; whatever `CODEX_HOME` the admin configured must already be signed in.
 */
export type CodexAuth =
  | { readonly kind: "chatgpt"; readonly env: NodeJS.ProcessEnv; readonly codexHome: string }
  | { readonly kind: "api_key"; readonly env: NodeJS.ProcessEnv; readonly codexHome: string; readonly apiKey: string }
  | { readonly kind: "ambient"; readonly env: NodeJS.ProcessEnv };

export function resolveCodexAuth(env: NodeJS.ProcessEnv): CodexAuth {
  const mode = agentAuthMode(env);
  const configuredHome = env[CODEX_ENV.home]?.trim();
  if (mode === "chatgpt") {
    const codexHome = ensurePrivateDir(configuredHome || path.join(agentHome(env), ".codex"));
    const { [CODEX_ENV.apiKey]: _apiKey, ...rest } = env;
    return { kind: "chatgpt", codexHome, env: { ...rest, [CODEX_ENV.home]: codexHome } };
  }
  if (mode !== undefined && mode !== "api_key") {
    throw RequestError.authRequired(
      undefined,
      `PLANE_AGENT_AUTH=${mode} is not supported by Codex (use api_key or chatgpt)`
    );
  }
  const apiKey = env[CODEX_ENV.apiKey]?.trim();
  if (apiKey) {
    const codexHome = ensurePrivateDir(configuredHome || path.join(agentHome(env), ".codex-api-key"));
    return { kind: "api_key", codexHome, apiKey, env: { ...env, [CODEX_ENV.home]: codexHome } };
  }
  if (mode === "api_key") {
    throw RequestError.authRequired(undefined, `there is no OpenAI API key: add one in ${AI_PROVIDERS_SETTINGS}`);
  }
  return { kind: "ambient", env };
}

export interface CodexAdapterOptions {
  readonly spawnAppServer?: SpawnCodexAppServer;
}

export function createCodexAdapter(options: CodexAdapterOptions = {}): AgentAdapter {
  return {
    info: agentInfo("plane-acp-codex", "Codex"),
    async startSession(init) {
      const session = new CodexSession(init, options);
      try {
        await session.start();
      } catch (error) {
        await session.close();
        if (error instanceof RequestError) throw error;
        throw RequestError.internalError(undefined, session.describeFailure(error));
      }
      return session;
    },
  };
}

interface TurnState {
  readonly context: TurnContext;
  turnId: string | undefined;
  lastTextItem: string | undefined;
  readonly summarisedItems: Set<string>;
  lastError: string | undefined;
  readonly done: Promise<{ status: string; error: string | undefined }>;
  finish(status: string, error?: string): void;
}

class CodexSession implements AdapterSession {
  readonly #host: SessionHost;
  readonly #init: SessionInit;
  readonly #options: CodexAdapterOptions;
  #client: CodexAppServerClient | undefined;
  #threadId = "";
  #catalog: ModelCatalog | undefined;
  #turn: TurnState | undefined;
  /** Approved MCP calls waiting for their `mcpToolCall` item, by `server:tool`. */
  readonly #approvedMcpCards = new Map<string, string[]>();
  /** Shown at the start of the next turn; nothing may precede the `session/new` response. */
  #pendingNotices: string[] = [];
  /** Notifications and server requests are handled strictly in arrival order. */
  #queue: Promise<void> = Promise.resolve();

  constructor(init: SessionInit, options: CodexAdapterOptions) {
    this.#init = init;
    this.#host = init.host;
    this.#options = options;
  }

  get catalog(): ModelCatalog | undefined {
    return this.#catalog;
  }

  async start(): Promise<void> {
    const host = this.#host;
    const auth = resolveCodexAuth(host.env);
    const client = new CodexAppServerClient({
      cwd: host.cwd,
      env: auth.env,
      ...(this.#options.spawnAppServer ? { spawnAppServer: this.#options.spawnAppServer } : {}),
      onNotification: (notification) => this.#enqueue(() => this.#onNotification(notification)),
      onServerRequest: (request) => this.#enqueue(() => this.#onServerRequest(request)),
      onExit: (error) => this.#turn?.finish("failed", this.describeFailure(error)),
    });
    this.#client = client;
    await client.initialize();
    await this.#signIn(client, auth);

    const listed = await client.request("model/list", { includeHidden: false }).catch(() => ({}) as JsonObject);
    const override = host.env[MODEL_ENV]?.trim();
    const thread = await client.request(
      "thread/start",
      {
        cwd: host.cwd,
        approvalPolicy: approvalPolicyFor(host.mode()),
        sandbox: "danger-full-access",
        config: {
          mcp_servers: toCodexMcpServers(this.#init.mcpServers),
          // Codex already drops *KEY*/*SECRET*/*TOKEN* from shell commands; make it explicit.
          shell_environment_policy: { inherit: "all", ignore_default_excludes: false, exclude: SECRET_ENV_GLOBS },
        },
        ...(override ? { model: override } : {}),
      },
      60_000
    );
    this.#threadId = stringValue(objectValue(thread.thread).id);
    if (!this.#threadId) throw new Error("codex thread/start returned no thread id");
    const current = override || stringValue(thread.model);
    const options = arrayValue(listed.data)
      .map(objectValue)
      .filter((model) => model.hidden !== true)
      .map((model): ModelChoice => {
        const value = stringValue(model.model) || stringValue(model.id);
        const name = stringValue(model.displayName) || value;
        const description = stringValue(model.description);
        return description ? { value, name, description } : { value, name };
      })
      .filter((model) => model.value);
    if (current && !options.some((model) => model.value === current))
      options.unshift({ value: current, name: current });
    this.#catalog = { options, current: current || options[0]?.value || "" };
  }

  describeFailure(error: unknown): string {
    return classifyCodexFailure(errorMessage(error), this.#client?.stderrTail() ?? []);
  }

  async prompt(context: TurnContext): Promise<StopReason> {
    const client = this.#client;
    if (!client || client.closed) throw new Error("codex app-server is not running");
    const outcome = deferred<{ status: string; error: string | undefined }>();
    let settled = false;
    const finish: TurnState["finish"] = (status, error) => {
      if (settled) return;
      settled = true;
      outcome.resolve({ status, error });
    };
    const done = outcome.promise;
    const state: TurnState = {
      context,
      turnId: undefined,
      lastTextItem: undefined,
      summarisedItems: new Set(),
      lastError: undefined,
      done,
      finish,
    };
    this.#turn = state;

    const env = this.#host.env;
    const stallMs = positive(env[CODEX_ENV.stallTimeoutMs]) ?? DEFAULT_STALL_TIMEOUT_MS;
    const turnMs = positive(env[CODEX_ENV.turnTimeoutMs]) ?? DEFAULT_TURN_TIMEOUT_MS;
    const interrupt = () => {
      if (state.turnId)
        void client
          .request("turn/interrupt", { threadId: this.#threadId, turnId: state.turnId }, INTERRUPT_GRACE_MS)
          .catch(() => {});
    };
    const onAbort = () => {
      interrupt();
      // Do not wait forever for Codex to confirm the interrupt.
      setTimeout(() => state.finish("interrupted"), INTERRUPT_GRACE_MS).unref();
    };
    context.signal.addEventListener("abort", onAbort, { once: true });
    const startedAt = Date.now();
    const watchdog = setInterval(
      () => {
        const quietFor = Date.now() - client.lastActivityAt();
        if (quietFor >= stallMs) {
          interrupt();
          state.finish("failed", `codex app-server stalled: no output for ${duration(quietFor)}`);
        } else if (Date.now() - startedAt >= turnMs) {
          interrupt();
          state.finish("failed", `codex turn timed out after ${duration(turnMs)}`);
        }
      },
      Math.min(stallMs, 1_000)
    );

    try {
      const started = await client.request("turn/start", {
        threadId: this.#threadId,
        input: [{ type: "text", text: promptToText(context.prompt), text_elements: [] }],
        approvalPolicy: approvalPolicyFor(this.#host.mode()),
        ...(this.#host.model() ? { model: this.#host.model() } : {}),
      });
      state.turnId = stringValue(objectValue(started.turn).id);
      if (context.signal.aborted) onAbort();
      const result = await done;
      await this.#queue;
      if (context.signal.aborted || result.status === "interrupted") return "cancelled";
      if (result.status === "failed") throw new Error(result.error ?? state.lastError ?? "codex turn failed");
      return "end_turn";
    } catch (error) {
      if (context.signal.aborted) return "cancelled";
      throw new Error(this.describeFailure(error), { cause: error });
    } finally {
      clearInterval(watchdog);
      context.signal.removeEventListener("abort", onAbort);
      if (this.#turn === state) this.#turn = undefined;
    }
  }

  async close(): Promise<void> {
    this.#client?.close();
  }

  async #signIn(client: CodexAppServerClient, auth: CodexAuth): Promise<void> {
    if (auth.kind === "api_key") {
      await client.request("account/login/start", { type: "apiKey", apiKey: auth.apiKey });
      return;
    }
    const account = await client.request("account/read", { refreshToken: false });
    if (auth.kind === "chatgpt") {
      if (stringValue(objectValue(account.account).type) !== "chatgpt") {
        throw RequestError.authRequired(undefined, CHATGPT_NOT_CONNECTED);
      }
      return;
    }
    if (account.account || account.requiresOpenaiAuth === false) return;
    throw RequestError.authRequired(undefined, CODEX_SIGNED_OUT);
  }

  #enqueue(work: () => Promise<void>): void {
    this.#queue = this.#queue.then(work).catch((error: unknown) => {
      this.#turn?.finish("failed", errorMessage(error));
    });
  }

  async #onNotification({ method, params }: CodexNotification): Promise<void> {
    if (method === "mcpServer/startupStatus/updated" && stringValue(params.status) === "failed") {
      this.#pendingNotices.push(`MCP server ${stringValue(params.name)} failed to start`);
    }
    const state = this.#turn;
    if (!state) return;
    for (const title of this.#pendingNotices.splice(0)) {
      await this.#host.emit({ sessionUpdate: "notice", severity: "warning", title });
    }
    const { messages } = state.context;
    const host = this.#host;
    switch (method) {
      case "item/agentMessage/delta": {
        const itemId = stringValue(params.itemId);
        if (itemId !== state.lastTextItem) {
          messages.breakMessage();
          state.lastTextItem = itemId;
        }
        await messages.text(stringValue(params.delta));
        return;
      }
      case "item/reasoning/summaryTextDelta":
        state.summarisedItems.add(stringValue(params.itemId));
        await messages.thought(stringValue(params.delta));
        return;
      case "item/reasoning/textDelta":
        // Raw reasoning only when the model gives no summary for this item, to avoid showing both.
        if (!state.summarisedItems.has(stringValue(params.itemId))) await messages.thought(stringValue(params.delta));
        return;
      case "item/started":
        await this.#itemStarted(objectValue(params.item), state);
        return;
      case "item/completed":
        await this.#itemCompleted(objectValue(params.item), state);
        return;
      case "turn/plan/updated":
        await host.emit({
          sessionUpdate: "plan",
          entries: arrayValue(params.plan).map((value): PlanEntry => {
            const step = objectValue(value);
            const status = stringValue(step.status);
            return {
              content: stringValue(step.step),
              priority: "medium",
              status: status === "completed" ? "completed" : status === "inProgress" ? "in_progress" : "pending",
            };
          }),
        });
        return;
      case "thread/tokenUsage/updated": {
        const usage = objectValue(params.tokenUsage);
        const size = numberValue(usage.modelContextWindow);
        const used = numberValue(objectValue(usage.last).totalTokens);
        if (size && used !== undefined) await host.emit({ sessionUpdate: "usage_update", used, size });
        return;
      }
      case "error":
        if (params.willRetry !== true)
          state.lastError = stringValue(objectValue(params.error).message) || state.lastError;
        return;
      case "turn/completed": {
        const turn = objectValue(params.turn);
        if (state.turnId && stringValue(turn.id) && stringValue(turn.id) !== state.turnId) return;
        state.finish(
          stringValue(turn.status) || "completed",
          stringValue(objectValue(turn.error).message) || state.lastError
        );
        return;
      }
      default:
        return;
    }
  }

  async #itemStarted(item: JsonObject, state: TurnState): Promise<void> {
    const tool = describeItem(item);
    if (!tool) return;
    if (stringValue(item.type) === "mcpToolCall") {
      // Show the call on the card its approval opened, rather than a second card.
      const card = this.#approvedMcpCards.get(`${stringValue(item.server)}:${stringValue(item.tool)}`)?.shift();
      if (card) this.#host.toolCalls.bind(stringValue(item.id), card);
    }
    state.context.messages.breakMessage();
    await this.#host.toolCalls.start(stringValue(item.id), { ...tool, status: "in_progress" });
  }

  async #itemCompleted(item: JsonObject, state: TurnState): Promise<void> {
    const type = stringValue(item.type);
    if (type === "agentMessage") {
      state.context.messages.breakMessage();
      return;
    }
    const tool = describeItem(item);
    if (!tool) return;
    const id = stringValue(item.id);
    const toolCalls = this.#host.toolCalls;
    const toolCallId = toolCalls.has(id)
      ? toolCalls.idFor(id)
      : await toolCalls.start(id, { ...tool, status: "in_progress" });
    const status = stringValue(item.status);
    const failed = status === "failed" || status === "declined" || Boolean(item.error);
    await toolCalls.update(toolCallId, { status: failed ? "failed" : "completed", ...itemOutput(item) });
  }

  async #onServerRequest(request: CodexServerRequest): Promise<void> {
    const client = this.#client;
    if (!client) return;
    const state = this.#turn;
    const { method, params } = request;
    if (!state) {
      client.respondError(request.id, -32000, "no active turn");
      return;
    }
    const signal = state.context.signal;
    const toolCalls = this.#host.toolCalls;

    if (method === "item/commandExecution/requestApproval" || method === "item/fileChange/requestApproval") {
      const isCommand = method === "item/commandExecution/requestApproval";
      const command = stringValue(params.command);
      const category: ToolCategory = isCommand ? commandCategory(params.commandActions) : "edit";
      const title = isCommand ? `Run: ${command.slice(0, 120)}` : stringValue(params.reason) || "Apply file changes";
      const kind = toolKindForCategory(category);
      const toolCallId = await toolCalls.start(stringValue(params.itemId) || undefined, {
        title,
        kind,
        rawInput: isCommand ? { command, cwd: stringValue(params.cwd) } : { reason: stringValue(params.reason) },
      });
      const decision = await this.#host.gate.check(
        {
          toolCallId,
          title,
          kind,
          category,
          rawInput: isCommand ? { command } : {},
          memoryKey: isCommand ? `codex:command:${command.trim().split(/\s+/)[0] ?? ""}` : "codex:fileChange",
        },
        signal
      );
      // An accepted call is completed by its `item/completed`; a refused one never runs.
      if (decision !== "allowed")
        await toolCalls.update(toolCallId, { status: "failed", rawOutput: { error: "denied by the user" } });
      client.respond(request.id, { decision: codexDecision(decision) });
      return;
    }

    if (method === "mcpServer/elicitation/request") {
      const meta = objectValue(params._meta);
      if (stringValue(meta.codex_approval_kind) !== "mcp_tool_call") {
        // Free-form elicitation forms have no ACP v1 equivalent; decline rather than guess.
        client.respond(request.id, { action: "decline", content: null, _meta: null });
        return;
      }
      const server = stringValue(params.serverName);
      const toolName = stringValue(meta.tool_name);
      const toolParams = objectValue(meta.tool_params);
      const category = classifyMcpCall(toolName, toolParams);
      const action = stringValue(toolParams.action);
      const title = `${server}: ${toolName}${action ? ` ${action}` : ""}`;
      const kind = toolKindForCategory(category);
      const toolCallId = await toolCalls.start(undefined, { title, kind, rawInput: toolParams });
      const decision = await this.#host.gate.check(
        { toolCallId, title, kind, category, rawInput: toolParams, memoryKey: `mcp:${server}:${toolName}:${action}` },
        signal
      );
      if (decision === "allowed") {
        const key = `${server}:${toolName}`;
        this.#approvedMcpCards.set(key, [...(this.#approvedMcpCards.get(key) ?? []), toolCallId]);
      } else {
        await toolCalls.update(toolCallId, { status: "failed", rawOutput: { error: "denied by the user" } });
      }
      client.respond(request.id, {
        action: decision === "allowed" ? "accept" : decision === "rejected" ? "decline" : "cancel",
        content: decision === "allowed" ? {} : null,
        _meta: null,
      });
      return;
    }

    // Permission escalations, user-input forms, dynamic tools, auth refresh: not offered over ACP.
    client.respondError(request.id, -32601, `${method} is not supported by the Plane ACP adapter`);
  }
}

function codexDecision(decision: PermissionDecision): "accept" | "decline" | "cancel" {
  if (decision === "allowed") return "accept";
  return decision === "rejected" ? "decline" : "cancel";
}

/** A command Codex parsed entirely into reads/listings/searches counts as a read for the gate. */
export function commandCategory(commandActions: unknown): ToolCategory {
  const actions = arrayValue(commandActions).map((action) => stringValue(objectValue(action).type));
  if (!actions.length || actions.some((type) => type !== "read" && type !== "listFiles" && type !== "search")) {
    return "execute";
  }
  return actions.every((type) => type === "read") ? "read" : "search";
}

function describeItem(
  item: JsonObject
):
  | { title: string; kind: ReturnType<typeof toolKindForCategory>; rawInput?: unknown; locations?: { path: string }[] }
  | undefined {
  switch (stringValue(item.type)) {
    case "commandExecution": {
      const command = stringValue(item.command);
      return {
        title: `Run: ${command.slice(0, 120)}`,
        kind: toolKindForCategory(commandCategory(item.commandActions)),
        rawInput: { command, cwd: stringValue(item.cwd) },
      };
    }
    case "fileChange": {
      const paths = arrayValue(item.changes)
        .map((change) => stringValue(objectValue(change).path))
        .filter(Boolean);
      return {
        title: `Edit ${paths.join(", ") || "files"}`,
        kind: "edit",
        locations: paths.map((file) => ({ path: file })),
      };
    }
    case "mcpToolCall": {
      const args = objectValue(item.arguments);
      const tool = stringValue(item.tool);
      const action = stringValue(args.action);
      return {
        title: `${stringValue(item.server)}: ${tool}${action ? ` ${action}` : ""}`,
        kind: toolKindForCategory(classifyMcpCall(tool, args)),
        rawInput: args,
      };
    }
    case "webSearch":
      return {
        title: `Search the web: ${stringValue(item.query)}`,
        kind: "fetch",
        rawInput: { query: stringValue(item.query) },
      };
    default:
      return undefined;
  }
}

function text(value: string): ToolCallContent[] {
  return value ? [{ type: "content", content: { type: "text", text: value } }] : [];
}

function itemOutput(item: JsonObject): { content?: ToolCallContent[]; rawOutput?: unknown } {
  switch (stringValue(item.type)) {
    case "commandExecution": {
      const output = stringValue(item.aggregatedOutput);
      return { content: text(output), rawOutput: { exitCode: item.exitCode ?? null, output } };
    }
    case "fileChange":
      return {
        content: arrayValue(item.changes).flatMap((value) => {
          const change = objectValue(value);
          return text(`${stringValue(change.path)}\n${stringValue(change.diff)}`);
        }),
      };
    case "mcpToolCall": {
      const error = stringValue(objectValue(item.error).message);
      const blocks = arrayValue(objectValue(item.result).content).map(objectValue);
      const output = error || blocks.map((block) => stringValue(block.text) || JSON.stringify(block)).join("\n");
      return { content: text(output), rawOutput: item.result ?? item.error ?? null };
    }
    default:
      return {};
  }
}

function duration(ms: number): string {
  return ms < 1_000 ? `${ms}ms` : `${Math.round(ms / 1_000)}s`;
}

function positive(value: string | undefined): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

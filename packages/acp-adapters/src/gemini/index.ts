/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* oxlint-disable no-await-in-loop -- session updates and tool calls must reach the client in order */
import path from "node:path";

import {
  RequestError,
  type ContentBlock,
  type McpServer,
  type PlanEntry,
  type StopReason,
  type ToolCallContent,
  type ToolCallLocation,
  type ToolCallStatus,
  type ToolKind,
} from "@agentclientprotocol/sdk";

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
import { scrubSecrets } from "../core/env.ts";
import { agentInfo, PACKAGE_VERSION } from "../core/info.ts";
import { arrayValue, errorMessage, numberValue, objectValue, stringValue, type JsonObject } from "../core/json.ts";
import { MODEL_ENV } from "../core/models.ts";
import { classifyMcpCall, type ToolCategory } from "../core/modes.ts";
import type { PermissionDecision } from "../core/permission.ts";
import type { ToolCallPatch, ToolCallStart } from "../core/turn.ts";
import { GeminiAcpClient, GeminiRpcError, type JsonRpcId } from "./client.ts";
import {
  GEMINI_DIR,
  GOOGLE_AUTH_TYPE,
  SessionMap,
  geminiPolicyPath,
  geminiSystemSettingsPath,
  hasGoogleCredentials,
  setSelectedAuthType,
} from "./files.ts";

/** The Gemini CLI release this adapter is written and tested against (see acp-version.lock.json). */
export const GEMINI_CLI_VERSION = "0.65.0";

/** `gemini` must be on PATH; the runner image installs it. Not configurable: the agent env is admin-supplied. */
export const GEMINI_COMMAND = "gemini";

export const GEMINI_ENV = {
  apiKey: "GEMINI_API_KEY",
  home: "GEMINI_CLI_HOME",
  systemSettings: "GEMINI_CLI_SYSTEM_SETTINGS_PATH",
} as const;

export const GOOGLE_NOT_CONNECTED = `Google account is not connected. Sign in with Google in ${AI_PROVIDERS_SETTINGS}.`;
const NO_CREDENTIALS = `Gemini has no credentials: add a Gemini API key or sign in with Google in ${AI_PROVIDERS_SETTINGS} (or set GEMINI_API_KEY in the agent's env)`;

const INITIALIZE_TIMEOUT_MS = 30_000;
/** A Google sign-in that cannot refresh falls back to an interactive flow; never wait for it. */
const AUTHENTICATE_TIMEOUT_MS = 60_000;
const SESSION_TIMEOUT_MS = 120_000;
const CANCEL_GRACE_MS = 5_000;
/** `session/load` streams history after its response; replay ends after this long without any. */
const REPLAY_QUIET_MS = 250;
const REPLAY_MAX_MS = 10_000;
/** Sentinel for `--allowed-mcp-server-names` when the session has no MCP server. */
const NO_MCP_SERVERS = "plane-acp-none";
const ZERO_WIDTH_SPACE = "\u200B";

/**
 * How Gemini CLI signs in, from `PLANE_AGENT_AUTH` and the env. Each method gets its own Gemini
 * home, because authenticating with a method other than the home's `selectedType` clears its
 * cached Google credentials:
 *
 * - `google_account`: `~/.gemini` (`GEMINI_CLI_HOME` unset), with the sign-in the
 *   `plane-agent-login` helper cached in `oauth_creds.json`.
 * - `api_key` (or unset with `GEMINI_API_KEY`): `GEMINI_CLI_HOME=~/.gemini-api-key`; the key is
 *   handed over in `authenticate` and never reaches Gemini's env.
 */
export type GeminiAuth =
  | { readonly kind: "api_key"; readonly apiKey: string; readonly cliHome: string; readonly geminiDir: string }
  | { readonly kind: "google_account"; readonly geminiDir: string };

export function resolveGeminiAuth(env: NodeJS.ProcessEnv): GeminiAuth {
  const mode = agentAuthMode(env);
  const home = agentHome(env);
  if (mode === "google_account") {
    const geminiDir = path.join(home, GEMINI_DIR);
    if (!hasGoogleCredentials(geminiDir)) throw RequestError.authRequired(undefined, GOOGLE_NOT_CONNECTED);
    return { kind: "google_account", geminiDir };
  }
  if (mode !== undefined && mode !== "api_key") {
    throw RequestError.authRequired(
      undefined,
      `PLANE_AGENT_AUTH=${mode} is not supported by Gemini (use api_key or google_account)`
    );
  }
  const apiKey = env[GEMINI_ENV.apiKey]?.trim();
  if (!apiKey) throw RequestError.authRequired(undefined, NO_CREDENTIALS);
  const cliHome = ensurePrivateDir(path.join(home, ".gemini-api-key"));
  return { kind: "api_key", apiKey, cliHome, geminiDir: path.join(cliHome, GEMINI_DIR) };
}

/**
 * Names that steer Gemini CLI's auth, storage, sandboxing or telemetry. The adapter sets the ones
 * it needs itself; the rest must not come from the agent env.
 */
const STEERING_ENV = new Set([
  "GEMINI_CLI_HOME",
  "GEMINI_CLI_SYSTEM_SETTINGS_PATH",
  "GEMINI_CLI_SYSTEM_DEFAULTS_PATH",
  "GEMINI_CLI_TRUSTED_FOLDERS_PATH",
  "GEMINI_CLI_TRUST_WORKSPACE",
  "GEMINI_CLI_NO_RELAUNCH",
  "GEMINI_CLI_USE_COMPUTE_ADC",
  "GEMINI_FORCE_FILE_STORAGE",
  "GEMINI_FORCE_ENCRYPTED_FILE_STORAGE",
  "GEMINI_SANDBOX",
  "GOOGLE_GENAI_USE_VERTEXAI",
  "GOOGLE_GENAI_USE_GCA",
  "CLOUD_SHELL",
  "SANDBOX",
  "SEATBELT_PROFILE",
  "NO_BROWSER",
  "BROWSER",
  "DISPLAY",
  "WAYLAND_DISPLAY",
  "PLANE_AGENT_AUTH",
]);

/**
 * Gemini's env: the agent env minus every credential-looking name (the key only travels in
 * `authenticate`) and the names above, plus the settings this adapter relies on.
 */
export function geminiEnv(env: NodeJS.ProcessEnv, auth: GeminiAuth): Record<string, string> {
  const out = Object.fromEntries(
    Object.entries(scrubSecrets(env)).filter(
      ([name]) => !STEERING_ENV.has(name) && !name.startsWith("GEMINI_TELEMETRY_")
    )
  );
  out.GEMINI_CLI_NO_RELAUNCH = "true";
  // The workspace must be trusted or Gemini connects no MCP server; trust it for this process only.
  out.GEMINI_CLI_TRUST_WORKSPACE = "true";
  out.GEMINI_TELEMETRY_ENABLED = "false";
  out[GEMINI_ENV.systemSettings] = geminiSystemSettingsPath(auth.kind);
  if (auth.kind === "api_key") out[GEMINI_ENV.home] = auth.cliHome;
  return out;
}

/** ACP MCP servers handed to Gemini: HTTP (Plane MCP) and stdio; SSE is not offered. */
export function geminiMcpServers(servers: readonly McpServer[]): McpServer[] {
  return servers.filter((server) => !("type" in server) || server.type !== "sse");
}

/** `gemini --acp` flags: default approval mode, our admin policy, no extensions, only our MCP servers. */
export function geminiArgs(servers: readonly McpServer[]): string[] {
  const names = servers.map((server) => server.name).join(",");
  return [
    "--acp",
    "--approval-mode",
    "default",
    "--extensions",
    "none",
    "--admin-policy",
    geminiPolicyPath(),
    "--allowed-mcp-server-names",
    names || NO_MCP_SERVERS,
  ];
}

/**
 * Gemini CLI runs a prompt that starts with `/` or `$` as one of its own commands (`/memory`,
 * `/extensions`, `/restore`…) without asking anyone. Those are not part of the Plane agent chat, so
 * such a prompt gets a leading zero-width space and reaches the model as plain text.
 */
export function guardSlashCommands(prompt: readonly ContentBlock[]): ContentBlock[] {
  let leading = "";
  for (const block of prompt) {
    if (block.type !== "text") break;
    leading += block.text;
  }
  const text = leading.trim();
  if (!text.startsWith("/") && !text.startsWith("$")) return [...prompt];
  return [{ type: "text", text: ZERO_WIDTH_SPACE }, ...prompt];
}

/** Gemini tool call ids are `<tool name>__<call id>`. */
export function geminiToolName(toolCallId: string): string {
  const separator = toolCallId.indexOf("__");
  return separator > 0 ? toolCallId.slice(0, separator) : "";
}

/** Gemini's name for an MCP server inside tool names (`mcp_<server>_<tool>`). */
function mcpPrefix(serverName: string): string {
  return `${serverName.startsWith("mcp_") ? serverName : `mcp_${serverName}`}_`.replace(/[^a-zA-Z0-9_\-.:]/g, "_");
}

/**
 * The `action` argument of a Plane MCP call, read from Gemini's title `tool(action: list, …)`.
 * Fails closed: anything but exactly one well-formed `action:` entry yields no action, which
 * classifies the call as a mutation.
 */
export function mcpActionFromTitle(title: string, tool: string): string | undefined {
  if (!title.startsWith(`${tool}(`) || !title.endsWith(")")) return undefined;
  const inner = title.slice(tool.length + 1, -1);
  if ((inner.match(/(?:^|, )action: /g) ?? []).length !== 1) return undefined;
  return /(?:^|, )action: ([A-Za-z0-9_-]+)(?:, |$)/.exec(inner)?.[1];
}

const KIND_CATEGORY: Readonly<Record<string, ToolCategory>> = {
  read: "read",
  search: "search",
  fetch: "fetch",
  think: "think",
  execute: "execute",
  edit: "edit",
  delete: "delete",
  move: "move",
};

export interface GeminiToolDescription {
  readonly category: ToolCategory;
  readonly memoryKey: string;
  readonly rawInput?: JsonObject;
}

/**
 * Gate category and "always allow" scope for a Gemini permission request. MCP calls are found by
 * their tool name (`mcp_<server>_…`) and classified like every other adapter's; built-in tools by
 * the `kind` Gemini CLI declares for them. Unknown kinds count as `other` (asks in `ask_writes`).
 */
export function describeGeminiToolCall(
  toolCall: { toolCallId: string; title: string; kind: string },
  mcpServerNames: readonly string[]
): GeminiToolDescription {
  const name = geminiToolName(toolCall.toolCallId);
  if (name.startsWith("mcp_")) {
    const server = mcpServerNames
      .toSorted((a, b) => mcpPrefix(b).length - mcpPrefix(a).length)
      .find((candidate) => name.startsWith(mcpPrefix(candidate)));
    if (!server) return { category: "mcp_write", memoryKey: `mcp:${name}` };
    const tool = name.slice(mcpPrefix(server).length);
    const action = mcpActionFromTitle(toolCall.title, tool);
    const input = action ? { action } : {};
    return {
      category: classifyMcpCall(tool, input),
      memoryKey: `mcp:${server}:${tool}:${action ?? ""}`,
      rawInput: input,
    };
  }
  const category = KIND_CATEGORY[toolCall.kind] ?? "other";
  if (category === "execute") {
    const command = toolCall.title.trim().split(/\s+/)[0] ?? "";
    return { category, memoryKey: `gemini:${name || "shell"}:${command}`, rawInput: { command: toolCall.title } };
  }
  return { category, memoryKey: `gemini:${name || toolCall.kind}` };
}

/** Our gate's answer as one of the options Gemini offered, picked by kind; never an "always" option. */
export function geminiPermissionOutcome(decision: PermissionDecision, options: readonly unknown[]): JsonObject {
  if (decision === "cancelled") return { outcome: { outcome: "cancelled" } };
  const kinds = decision === "allowed" ? ["allow_once"] : ["reject_once", "reject_always"];
  const option = options.map(objectValue).find((candidate) => kinds.includes(stringValue(candidate.kind)));
  const optionId = option ? stringValue(option.optionId) : "";
  // No matching option: cancel, which Gemini treats as a rejection. Fails closed.
  return optionId ? { outcome: { outcome: "selected", optionId } } : { outcome: { outcome: "cancelled" } };
}

const TOOL_KINDS = new Set([
  "read",
  "edit",
  "delete",
  "move",
  "search",
  "execute",
  "think",
  "fetch",
  "switch_mode",
  "other",
]);
const TOOL_STATUSES = new Set(["pending", "in_progress", "completed", "failed"]);
const STOP_REASONS = new Set(["end_turn", "max_tokens", "max_turn_requests", "refusal", "cancelled"]);

function toolKind(value: unknown): ToolKind {
  const kind = stringValue(value);
  return (TOOL_KINDS.has(kind) ? kind : "other") as ToolKind;
}

function toolPatch(update: JsonObject): ToolCallPatch {
  const status = stringValue(update.status);
  return {
    ...(stringValue(update.title) ? { title: stringValue(update.title) } : {}),
    ...(update.kind === undefined ? {} : { kind: toolKind(update.kind) }),
    ...(TOOL_STATUSES.has(status) ? { status: status as ToolCallStatus } : {}),
    ...(Array.isArray(update.content) ? { content: update.content as ToolCallContent[] } : {}),
    ...(Array.isArray(update.locations) && update.locations.length
      ? { locations: update.locations as ToolCallLocation[] }
      : {}),
  };
}

function toolStart(update: JsonObject): ToolCallStart {
  const patch = toolPatch(update);
  return { ...patch, title: patch.title ?? "Tool", kind: patch.kind ?? "other" };
}

/**
 * Google API errors reach us as JSON nested inside JSON strings
 * (`{"error":{"message":"{\\n \\"error\\": {\\"message\\": \\"API key not valid…\\"`).
 * Returns the innermost `message`, or `text` unchanged when there is none.
 */
export function innermostApiMessage(text: string): string {
  let current = text;
  for (let depth = 0; depth < 6; depth++) {
    const match = /"message"\s*:\s*"((?:\\.|[^"\\])*)"/.exec(current);
    if (!match) break;
    let next: string;
    try {
      next = JSON.parse(`"${match[1]}"`) as string;
    } catch {
      break;
    }
    if (!next || next === current) break;
    current = next;
  }
  return current.trim();
}

/** Turn an error from Gemini into an actionable message. */
export function describeGeminiFailure(error: unknown, stderr: readonly string[] = []): string {
  const message = errorMessage(error);
  if (/ENOENT/.test(message) && /spawn/.test(message)) {
    return `Gemini CLI is not installed: \`${GEMINI_COMMAND}\` was not found on PATH`;
  }
  const code = error instanceof GeminiRpcError ? error.code : undefined;
  const text = `${message}\n${stderr.join("\n")}`;
  if (
    code === 401 ||
    code === 403 ||
    /(API key not valid|API_KEY_INVALID|PERMISSION_DENIED|UNAUTHENTICATED|invalid_grant|invalid authentication)/i.test(
      text
    )
  ) {
    return `Gemini rejected the credentials: ${innermostApiMessage(message)} Check them in ${AI_PROVIDERS_SETTINGS}.`;
  }
  return message;
}

export interface GeminiAdapterOptions {
  /** The Gemini CLI command; tests run the adapter in-process against a fake. Defaults to `gemini` on PATH. */
  readonly command?: string;
}

export function createGeminiAdapter(options: GeminiAdapterOptions = {}): AgentAdapter {
  const open = async (init: SessionInit, load: boolean): Promise<GeminiSession> => {
    const auth = resolveGeminiAuth(init.host.env);
    const session = new GeminiSession(init, auth, options.command ?? GEMINI_COMMAND);
    try {
      await session.start(load);
    } catch (error) {
      await session.close();
      if (error instanceof RequestError) throw error;
      throw RequestError.internalError(undefined, describeGeminiFailure(error, session.stderrTail()));
    }
    return session;
  };
  return {
    info: agentInfo("plane-acp-gemini", "Gemini"),
    promptCapabilities: { image: false, audio: false, embeddedContext: true },
    startSession: (init) => open(init, false),
    loadSession: (init) => open(init, true),
  };
}

interface TurnState {
  readonly context: TurnContext;
}

class GeminiSession implements AdapterSession {
  readonly #host: SessionHost;
  readonly #auth: GeminiAuth;
  readonly #command: string;
  readonly #mcpServers: McpServer[];
  readonly #sessions: SessionMap;
  #client: GeminiAcpClient | undefined;
  #geminiSessionId = "";
  #catalog: ModelCatalog | undefined;
  #turn: TurnState | undefined;
  /** Set while `session/load` replays history. */
  #replay: { seq: number; lastAt: number } | undefined;
  /** Notifications and Gemini's requests are handled strictly in arrival order. */
  #queue: Promise<void> = Promise.resolve();

  constructor(init: SessionInit, auth: GeminiAuth, command: string) {
    this.#host = init.host;
    this.#auth = auth;
    this.#command = command;
    this.#mcpServers = geminiMcpServers(init.mcpServers);
    this.#sessions = new SessionMap(auth.geminiDir);
  }

  get catalog(): ModelCatalog | undefined {
    return this.#catalog;
  }

  stderrTail(): readonly string[] {
    return this.#client?.stderrTail() ?? [];
  }

  async start(load: boolean): Promise<void> {
    const host = this.#host;
    const auth = this.#auth;
    const mapped = load ? this.#sessions.get(host.sessionId) : undefined;
    if (load && !mapped) throw RequestError.resourceNotFound(host.sessionId);
    if (auth.kind === "google_account") setSelectedAuthType(auth.geminiDir, GOOGLE_AUTH_TYPE);

    const client = new GeminiAcpClient({
      command: this.#command,
      args: geminiArgs(this.#mcpServers),
      cwd: host.cwd,
      env: geminiEnv(host.env, auth),
      onNotification: (method, params) => this.#enqueue(() => this.#onNotification(method, params)),
      onRequest: (id, method, params) => this.#enqueue(() => this.#onRequest(id, method, params)),
      onExit: () => {},
    });
    this.#client = client;
    await client.request(
      "initialize",
      {
        protocolVersion: 1,
        clientCapabilities: { fs: { readTextFile: false, writeTextFile: false }, terminal: false },
        clientInfo: { name: "plane-acp-gemini", version: PACKAGE_VERSION },
      },
      INITIALIZE_TIMEOUT_MS
    );
    await this.#authenticate(client);

    const params = { cwd: host.cwd, mcpServers: this.#mcpServers };
    let result: JsonObject;
    if (mapped) {
      this.#geminiSessionId = mapped;
      this.#replay = { seq: 0, lastAt: Date.now() };
      try {
        result = await client.request("session/load", { ...params, sessionId: mapped }, SESSION_TIMEOUT_MS);
      } catch (error) {
        this.#replay = undefined;
        if (error instanceof GeminiRpcError && /session/i.test(error.message)) {
          throw RequestError.resourceNotFound(host.sessionId);
        }
        throw error;
      }
      await this.#settleReplay();
    } else {
      result = await client.request("session/new", params, SESSION_TIMEOUT_MS);
      this.#geminiSessionId = stringValue(result.sessionId);
      if (!this.#geminiSessionId) throw new Error("gemini session/new returned no session id");
      this.#sessions.set(host.sessionId, this.#geminiSessionId);
    }
    await this.#setCatalog(objectValue(result.models));
  }

  async prompt(context: TurnContext): Promise<StopReason> {
    const client = this.#client;
    if (!client || client.closed) throw new Error("gemini is not running");
    const state: TurnState = { context };
    this.#turn = state;
    const gaveUp = deferred<undefined>();
    const onAbort = () => {
      client.notify("session/cancel", { sessionId: this.#geminiSessionId });
      // Do not wait forever for Gemini to confirm the cancel.
      setTimeout(() => gaveUp.resolve(undefined), CANCEL_GRACE_MS).unref();
    };
    context.signal.addEventListener("abort", onAbort, { once: true });
    if (context.signal.aborted) onAbort();
    try {
      const response = client.request(
        "session/prompt",
        { sessionId: this.#geminiSessionId, prompt: guardSlashCommands(context.prompt) },
        0
      );
      response.catch(() => {});
      const result = await Promise.race([response, gaveUp.promise]);
      await this.#queue;
      if (context.signal.aborted) return "cancelled";
      const stopReason = stringValue(objectValue(result).stopReason);
      return (STOP_REASONS.has(stopReason) ? stopReason : "end_turn") as StopReason;
    } catch (error) {
      if (context.signal.aborted) return "cancelled";
      throw new Error(describeGeminiFailure(error, client.stderrTail()), { cause: error });
    } finally {
      context.signal.removeEventListener("abort", onAbort);
      if (this.#turn === state) this.#turn = undefined;
    }
  }

  async setModel(model: string): Promise<void> {
    await this.#client?.request("session/set_model", { sessionId: this.#geminiSessionId, modelId: model });
  }

  async close(): Promise<void> {
    await this.#client?.close();
  }

  async #authenticate(client: GeminiAcpClient): Promise<void> {
    const auth = this.#auth;
    try {
      if (auth.kind === "api_key") {
        await client.request("authenticate", { methodId: "gemini-api-key", _meta: { "api-key": auth.apiKey } });
      } else {
        await client.request("authenticate", { methodId: GOOGLE_AUTH_TYPE }, AUTHENTICATE_TIMEOUT_MS);
      }
    } catch (error) {
      const reason = describeGeminiFailure(error, client.stderrTail());
      throw RequestError.authRequired(
        undefined,
        auth.kind === "google_account"
          ? `Google sign-in failed (${reason}). Sign in with Google again in ${AI_PROVIDERS_SETTINGS}.`
          : `Gemini rejected the API key (${reason}). Check it in ${AI_PROVIDERS_SETTINGS}.`
      );
    }
  }

  async #setCatalog(models: JsonObject): Promise<void> {
    const options = arrayValue(models.availableModels)
      .map(objectValue)
      .map((model): ModelChoice => {
        const value = stringValue(model.modelId);
        const name = stringValue(model.name) || value;
        const description = stringValue(model.description);
        return description ? { value, name, description } : { value, name };
      })
      .filter((model) => model.value);
    let current = stringValue(models.currentModelId) || options[0]?.value || "";
    const override = this.#host.env[MODEL_ENV]?.trim();
    if (override && override !== current) {
      await this.setModel(override);
      current = override;
    }
    if (current && !options.some((model) => model.value === current))
      options.unshift({ value: current, name: current });
    this.#catalog = { options, current };
  }

  /** History arrives around the `session/load` response; wait until it stops. */
  async #settleReplay(): Promise<void> {
    const deadline = Date.now() + REPLAY_MAX_MS;
    while (this.#replay && Date.now() < deadline) {
      await this.#queue;
      if (Date.now() - this.#replay.lastAt >= REPLAY_QUIET_MS) break;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    await this.#queue;
    this.#replay = undefined;
  }

  #enqueue(work: () => Promise<void>): void {
    this.#queue = this.#queue.then(work).catch(() => {});
  }

  async #onNotification(method: string, params: JsonObject): Promise<void> {
    if (method !== "session/update" || stringValue(params.sessionId) !== this.#geminiSessionId) return;
    const update = objectValue(params.update);
    if (this.#replay) {
      this.#replay.lastAt = Date.now();
      await this.#replayUpdate(update, this.#replay);
      return;
    }
    const state = this.#turn;
    if (!state) return;
    const host = this.#host;
    const { messages } = state.context;
    switch (stringValue(update.sessionUpdate)) {
      case "agent_message_chunk":
      case "agent_thought_chunk": {
        const content = objectValue(update.content);
        if (stringValue(content.type) !== "text") return;
        if (update.sessionUpdate === "agent_message_chunk") await messages.text(stringValue(content.text));
        else await messages.thought(stringValue(content.text));
        return;
      }
      case "tool_call":
        messages.breakMessage();
        await host.toolCalls.start(stringValue(update.toolCallId) || undefined, toolStart(update));
        return;
      case "tool_call_update": {
        const id = stringValue(update.toolCallId);
        if (!id) return;
        if (!host.toolCalls.has(id)) {
          messages.breakMessage();
          await host.toolCalls.start(id, toolStart(update));
        }
        await host.toolCalls.update(host.toolCalls.idFor(id), toolPatch(update));
        return;
      }
      case "plan":
        await host.emit({ sessionUpdate: "plan", entries: arrayValue(update.entries) as PlanEntry[] });
        return;
      case "usage_update": {
        const used = numberValue(update.used);
        const size = numberValue(update.size);
        if (used !== undefined && size) await host.emit({ sessionUpdate: "usage_update", used, size });
        return;
      }
      default:
        // available_commands_update (Gemini's slash commands are not offered), current_mode_update
        // (Gemini's own modes stay at `default`), session info: not part of the Plane contract.
        return;
    }
  }

  async #replayUpdate(update: JsonObject, replay: { seq: number }): Promise<void> {
    const kind = stringValue(update.sessionUpdate);
    const content = objectValue(update.content);
    const text = stringValue(content.text);
    switch (kind) {
      case "user_message_chunk":
        // Gemini records its own session context and tool results as user turns.
        if (!text.trim() || text.startsWith("<session_context>") || text.startsWith("[Function Response:")) return;
        await this.#host.emit({ sessionUpdate: kind, content: { type: "text", text }, messageId: `h-${++replay.seq}` });
        return;
      case "agent_message_chunk":
      case "agent_thought_chunk":
        if (!text) return;
        await this.#host.emit({ sessionUpdate: kind, content: { type: "text", text }, messageId: `h-${++replay.seq}` });
        return;
      case "tool_call": {
        const id = stringValue(update.toolCallId);
        if (id) await this.#host.toolCalls.start(id, toolStart(update));
        return;
      }
      default:
        return;
    }
  }

  async #onRequest(id: JsonRpcId, method: string, params: JsonObject): Promise<void> {
    const client = this.#client;
    if (!client) return;
    if (method !== "session/request_permission") {
      // No fs/terminal capabilities were offered; anything else has no Plane equivalent.
      client.respondError(id, -32601, `${method} is not supported by the Plane ACP adapter`);
      return;
    }
    const state = this.#turn;
    if (!state || stringValue(params.sessionId) !== this.#geminiSessionId) {
      client.respond(id, { outcome: { outcome: "cancelled" } });
      return;
    }
    const toolCall = objectValue(params.toolCall);
    const geminiId = stringValue(toolCall.toolCallId);
    const toolCalls = this.#host.toolCalls;
    let toolCallId: string;
    if (geminiId && toolCalls.has(geminiId)) {
      toolCallId = toolCalls.idFor(geminiId);
    } else {
      state.context.messages.breakMessage();
      toolCallId = await toolCalls.start(geminiId || undefined, toolStart(toolCall));
    }
    const title = stringValue(toolCall.title) || "Tool";
    const kind = toolKind(toolCall.kind);
    const described = describeGeminiToolCall(
      { toolCallId: geminiId, title, kind },
      this.#mcpServers.map((server) => server.name)
    );
    let decision: PermissionDecision;
    try {
      decision = await this.#host.gate.check(
        {
          toolCallId,
          title,
          kind,
          category: described.category,
          memoryKey: described.memoryKey,
          ...(described.rawInput ? { rawInput: described.rawInput } : {}),
        },
        state.context.signal
      );
    } catch {
      decision = "cancelled";
    }
    client.respond(id, geminiPermissionOutcome(decision, arrayValue(params.options)));
  }
}

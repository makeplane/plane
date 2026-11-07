/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import {
  client,
  PROTOCOL_VERSION,
  type AgentCapabilities,
  type ClientApp,
  type ClientConnection,
  type Implementation,
  type InitializeResponse,
  type ListSessionsResponse,
  type PermissionOption,
  type RequestPermissionRequest,
  type RequestPermissionResponse,
  type SessionNotification,
  type StopReason,
  type ToolCallUpdate,
} from "@agentclientprotocol/sdk";

import { describeClose, type CloseInfo } from "./close-codes.ts";
import {
  appendNotice,
  appendTurnEnd,
  appendUserPrompt,
  applyModeChange,
  applySessionSetup,
  applySessionUpdate,
  createTranscript,
  effortOption,
  modelOption,
  type TranscriptState,
} from "./transcript.ts";
import type { AgentTransport, AgentTransportFactory } from "./transport.ts";

/** `session/new` `_meta` key for the starting permission level (clamped by the bridge). */
export const INITIAL_MODE_META_KEY = "plane/initialModeId";
/** `session/new|load` `_meta` keys for the starting model and effort (ignored when the agent lacks them). */
export const INITIAL_MODEL_META_KEY = "plane/initialModel";
export const INITIAL_EFFORT_META_KEY = "plane/initialEffort";

/** JSON-RPC "invalid params": what the bridge answers to a `session/set_mode` above the admin max. */
export const INVALID_PARAMS = -32602;

/** ACP "authentication required": the agent has no usable credential (no key, a lost sign-in). */
export const AUTH_REQUIRED = -32000;

export type AgentChatStatus = "idle" | "connecting" | "ready" | "reconnecting" | "closed";

export interface PendingPermission {
  readonly id: string;
  readonly sessionId: string;
  readonly toolCall: ToolCallUpdate;
  readonly options: readonly PermissionOption[];
}

export interface AgentChatSnapshot {
  readonly status: AgentChatStatus;
  readonly agentInfo: Implementation | null;
  readonly capabilities: AgentCapabilities | null;
  readonly sessionId: string | null;
  readonly transcript: TranscriptState;
  readonly permissions: readonly PendingPermission[];
  readonly prompting: boolean;
  /** How the last connection ended, until the next one is ready. */
  readonly close: CloseInfo | null;
}

/** A JSON-RPC error answer from the agent or the bridge. */
export class AgentRequestError extends Error {
  readonly code: number;
  readonly data: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = "AgentRequestError";
    this.code = code;
    this.data = data;
  }
}

/** The request could not complete because the connection is gone (or was never opened). */
export class AgentDisconnectedError extends Error {
  readonly close: CloseInfo | null;

  constructor(close: CloseInfo | null) {
    super(close ? `Agent connection closed (${close.code})` : "Not connected to the agent");
    this.name = "AgentDisconnectedError";
    this.close = close;
  }
}

export interface AgentChatSessionOptions {
  /** Opens a connection; called again for every reconnect. */
  readonly transport: AgentTransportFactory;
  readonly clientInfo?: Implementation;
  /** Reconnect and `session/load` on its own after a 4410 (token expired). Defaults to true. */
  readonly reconnectOnExpiry?: boolean;
}

export interface NewSessionOptions {
  /** Requested starting permission level; the bridge clamps it to the admin maximum. */
  readonly initialModeId?: string;
  /** Starting model id, e.g. the one last used with this agent. Ignored when the agent does not offer it. */
  readonly initialModel?: string;
  /** Starting reasoning effort. Ignored when the model does not take it. */
  readonly initialEffort?: string;
}

/** `session/load` takes the same starting choices except the permission level, which the bridge sets. */
export type LoadSessionOptions = Omit<NewSessionOptions, "initialModeId">;

function startMeta(options: NewSessionOptions): { _meta?: Record<string, string> } {
  const meta: Record<string, string> = {};
  if (options.initialModeId) meta[INITIAL_MODE_META_KEY] = options.initialModeId;
  if (options.initialModel) meta[INITIAL_MODEL_META_KEY] = options.initialModel;
  if (options.initialEffort) meta[INITIAL_EFFORT_META_KEY] = options.initialEffort;
  return Object.keys(meta).length > 0 ? { _meta: meta } : {};
}

export interface ReconnectResult {
  /** The previous conversation was reloaded (`session/load`); false: a new session was started. */
  readonly resumed: boolean;
}

interface Link {
  readonly connection: ClientConnection;
  readonly transport: AgentTransport;
}

interface PermissionEntry extends PendingPermission {
  readonly resolve: (response: RequestPermissionResponse) => void;
}

type Listener = (snapshot: AgentChatSnapshot) => void;

/** How long a failed request waits for the socket's close event, to report its close code. */
const CLOSE_GRACE_MS = 50;

function delay(ms: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(null), ms);
  });
}

const DEFAULT_CLIENT_INFO: Implementation = { name: "plane-web", title: "Plane", version: "1" };

function isRpcError(error: unknown): error is { code: number; message?: unknown; data?: unknown } {
  return Boolean(error && typeof error === "object" && typeof (error as { code?: unknown }).code === "number");
}

function toAgentError(error: unknown, close: CloseInfo | null, connected: boolean): Error {
  if (error instanceof AgentRequestError || error instanceof AgentDisconnectedError) return error;
  if (isRpcError(error)) {
    return new AgentRequestError(
      error.code,
      typeof error.message === "string" ? error.message : "Request failed",
      error.data
    );
  }
  if (close || !connected) return new AgentDisconnectedError(close);
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * One chat with one agent over ACP: a real ACP client (SDK `client()`) behind the bridge.
 *
 * It owns the connection lifecycle (connect, initialize, reconnect after a 4410 with
 * `session/load`), the transcript (through the pure reducer in `transcript.ts`) and the
 * permission requests the UI answers. Framework-agnostic: UIs `subscribe()` to snapshots.
 */
export class AgentChatSession {
  readonly #options: AgentChatSessionOptions;
  readonly #app: ClientApp;
  readonly #listeners = new Set<Listener>();
  readonly #permissions = new Map<string, PermissionEntry>();

  #connection: ClientConnection | undefined;
  #transport: AgentTransport | undefined;
  /** Bumped per connection, so a stale close event never touches the current one. */
  #generation = 0;
  #permissionCounter = 0;
  #disposed = false;

  #status: AgentChatStatus = "idle";
  #agentInfo: Implementation | null = null;
  #capabilities: AgentCapabilities | null = null;
  #sessionId: string | null = null;
  #transcript: TranscriptState = createTranscript();
  /** The last model and effort a session reported; kept while a load is pending or after it failed. */
  #choices: LoadSessionOptions = {};
  #prompting = false;
  #close: CloseInfo | null = null;
  /** Updates for a session whose `session/new` response has not arrived yet. */
  #buffered: SessionNotification[] | undefined;
  #snapshot: AgentChatSnapshot;

  constructor(options: AgentChatSessionOptions) {
    this.#options = options;
    this.#snapshot = this.#buildSnapshot();
    this.#app = client({ name: "plane-agent-chat" })
      .onRequest("session/request_permission", ({ params, signal }) => this.#requestPermission(params, signal))
      .onNotification("session/update", ({ params }) => this.#onUpdate(params));
  }

  get snapshot(): AgentChatSnapshot {
    return this.#snapshot;
  }

  /**
   * The model and effort the chat last ran on, to start a replacement session on the same ones.
   * Unlike the transcript, this survives a `session/load` that is still pending or failed.
   */
  get choices(): LoadSessionOptions {
    return this.#choices;
  }

  /** The agent can resume a session (`session/load`). */
  get supportsLoad(): boolean {
    return this.#capabilities?.loadSession === true;
  }

  /** The agent can list past sessions (`session/list`). */
  get supportsList(): boolean {
    return this.#capabilities?.sessionCapabilities?.list != null;
  }

  subscribe(listener: Listener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /** Open a connection and `initialize`. Replaces any current connection. */
  async connect(): Promise<InitializeResponse> {
    const result = await this.#open();
    this.#status = "ready";
    this.#emit();
    return result;
  }

  /** Transport + `initialize`, leaving the status at connecting/reconnecting until the caller is done. */
  async #open(): Promise<InitializeResponse> {
    if (this.#disposed) throw new AgentDisconnectedError(this.#close);
    this.#dropConnection();
    const generation = ++this.#generation;
    if (this.#status !== "reconnecting") this.#status = "connecting";
    this.#emit();

    let transport: AgentTransport;
    try {
      transport = this.#options.transport();
    } catch (error) {
      this.#status = "closed";
      this.#emit();
      throw error;
    }
    this.#transport = transport;
    const connection = this.#app.connect(transport.stream);
    this.#connection = connection;
    void transport.closed.then((info) => this.#onClosed(generation, info));

    try {
      const result = await connection.agent.request("initialize", {
        protocolVersion: PROTOCOL_VERSION,
        // The bridge forces fs/terminal off anyway; notices let it send the Plane-MCP warning.
        clientCapabilities: {
          fs: { readTextFile: false, writeTextFile: false },
          terminal: false,
          session: { notices: {} },
        },
        clientInfo: this.#options.clientInfo ?? DEFAULT_CLIENT_INFO,
      });
      if (generation !== this.#generation) throw new AgentDisconnectedError(this.#close);
      this.#agentInfo = result.agentInfo ?? null;
      this.#capabilities = result.agentCapabilities ?? {};
      this.#close = null;
      return result;
    } catch (error) {
      const failure = await this.#failure(error, { connection, transport });
      // Not already handled by the close handler (or superseded by a newer connect()).
      if (generation === this.#generation) {
        if (this.#connection === connection) this.#dropConnection();
        if (failure instanceof AgentDisconnectedError && failure.close) this.#close = failure.close;
        this.#status = "closed";
        this.#emit();
      }
      throw failure;
    }
  }

  /** Start a new conversation. The transcript is reset. */
  async newSession(options: NewSessionOptions = {}): Promise<string> {
    const link = this.#requireLink();
    const { connection } = link;
    this.#buffered = [];
    try {
      const result = await connection.agent.request("session/new", {
        cwd: "/",
        mcpServers: [],
        ...startMeta(options),
      });
      this.#cancelPermissions();
      this.#sessionId = result.sessionId;
      let transcript = createTranscript(result);
      for (const notification of this.#buffered) {
        if (notification.sessionId === result.sessionId)
          transcript = applySessionUpdate(transcript, notification.update);
      }
      this.#transcript = transcript;
      this.#emit();
      return result.sessionId;
    } catch (error) {
      throw await this.#failure(error, link);
    } finally {
      this.#buffered = undefined;
    }
  }

  /** Resume a conversation. The agent replays its history as `session/update`s. */
  async loadSession(sessionId: string, options: LoadSessionOptions = {}): Promise<void> {
    const link = this.#requireLink();
    const { connection } = link;
    if (!this.supportsLoad) throw new AgentRequestError(-32601, "This agent cannot resume sessions");
    this.#cancelPermissions();
    this.#sessionId = sessionId;
    this.#transcript = createTranscript();
    this.#emit();
    try {
      const result = await connection.agent.request("session/load", {
        sessionId,
        cwd: "/",
        mcpServers: [],
        ...startMeta(options),
      });
      if (this.#sessionId === sessionId) {
        this.#transcript = applySessionSetup(this.#transcript, result);
        this.#emit();
      }
    } catch (error) {
      throw await this.#failure(error, link);
    }
  }

  /** Past sessions, newest first as the agent returns them. The bridge pins the `cwd`. */
  async listSessions(cursor?: string): Promise<ListSessionsResponse> {
    const link = this.#requireLink();
    try {
      return await link.connection.agent.request("session/list", cursor ? { cursor } : {});
    } catch (error) {
      throw await this.#failure(error, link);
    }
  }

  /** Send a text prompt and wait for the turn to end. */
  async prompt(text: string): Promise<StopReason> {
    const link = this.#requireLink();
    const { connection } = link;
    const sessionId = this.#requireSession();
    this.#transcript = appendUserPrompt(this.#transcript, text);
    this.#prompting = true;
    this.#emit();
    try {
      const result = await connection.agent.request("session/prompt", {
        sessionId,
        prompt: [{ type: "text", text }],
      });
      if (this.#sessionId === sessionId) this.#transcript = appendTurnEnd(this.#transcript, result.stopReason);
      return result.stopReason;
    } catch (error) {
      const failure = await this.#failure(error, link);
      if (this.#sessionId === sessionId) {
        this.#transcript = appendTurnEnd(
          this.#transcript,
          failure instanceof AgentDisconnectedError ? "disconnected" : "failed"
        );
      }
      throw failure;
    } finally {
      if (this.#sessionId === sessionId) this.#prompting = false;
      this.#emit();
    }
  }

  /**
   * Stop the running turn (`session/cancel`). ACP requires the client to answer the turn's open
   * permission requests with `cancelled`; the prompt then ends with `stopReason: "cancelled"`.
   */
  async cancel(): Promise<void> {
    const connection = this.#connection;
    const sessionId = this.#sessionId;
    if (!connection || !sessionId) return;
    this.#cancelPermissions(sessionId);
    this.#emit();
    await connection.agent.notify("session/cancel", { sessionId }).catch(() => {});
  }

  /**
   * Switch the permission level. A level above the admin maximum is answered with
   * {@link INVALID_PARAMS} by the bridge and rethrown as an {@link AgentRequestError}.
   */
  async setMode(modeId: string): Promise<void> {
    const link = this.#requireLink();
    const sessionId = this.#requireSession();
    try {
      await link.connection.agent.request("session/set_mode", { sessionId, modeId });
    } catch (error) {
      throw await this.#failure(error, link);
    }
    if (this.#sessionId === sessionId) {
      this.#transcript = applyModeChange(this.#transcript, modeId);
      this.#emit();
    }
  }

  /** Change a `select` config option (`session/set_config_option`). */
  async setConfigOption(configId: string, value: string): Promise<void> {
    const link = this.#requireLink();
    const sessionId = this.#requireSession();
    let result;
    try {
      result = await link.connection.agent.request("session/set_config_option", { sessionId, configId, value });
    } catch (error) {
      throw await this.#failure(error, link);
    }
    if (this.#sessionId === sessionId) {
      this.#transcript = applySessionSetup(this.#transcript, { configOptions: result.configOptions });
      this.#emit();
    }
  }

  /** Change the model (the `model` config option). */
  async setModel(value: string): Promise<void> {
    const option = modelOption(this.#transcript);
    if (!option) throw new AgentRequestError(INVALID_PARAMS, "This agent has no model option");
    await this.setConfigOption(option.id, value);
  }

  /** Change the reasoning effort (the `thought_level` config option). */
  async setEffort(value: string): Promise<void> {
    const option = effortOption(this.#transcript);
    if (!option) throw new AgentRequestError(INVALID_PARAMS, "This model has no reasoning effort option");
    await this.setConfigOption(option.id, value);
  }

  /** Answer a permission request with one of its options, or `null` to cancel it. */
  respondToPermission(id: string, optionId: string | null): void {
    this.#settlePermission(
      id,
      optionId === null ? { outcome: { outcome: "cancelled" } } : { outcome: { outcome: "selected", optionId } }
    );
    this.#emit();
  }

  /**
   * Open a new connection and pick the conversation back up: `session/load` when the agent can,
   * otherwise a new session (the transcript stays, with a notice that the agent starts afresh).
   */
  async reconnect(): Promise<ReconnectResult> {
    const sessionId = this.#sessionId;
    const modeId = this.#transcript.modes?.currentModeId;
    const choices = this.#choices;
    this.#status = "reconnecting";
    try {
      await this.#open();
      let resumed = false;
      if (sessionId && this.supportsLoad) {
        await this.loadSession(sessionId, choices);
        resumed = true;
      } else if (sessionId) {
        const previous = this.#transcript;
        await this.newSession({ ...choices, ...(modeId ? { initialModeId: modeId } : {}) });
        // Keep the conversation on screen, but the plan and usage belonged to the old session.
        const carried = { ...previous, ...pickSetup(this.#transcript), plan: null, usage: null };
        this.#transcript = appendNotice(carried, "info", "", null, "new_session");
      }
      this.#status = "ready";
      this.#emit();
      return { resumed };
    } catch (error) {
      if (this.#status === "reconnecting") {
        this.#status = "closed";
        this.#emit();
      }
      throw error;
    }
  }

  /** Close the connection for good (e.g. leaving the page). */
  dispose(): void {
    this.#disposed = true;
    this.#cancelPermissions();
    this.#dropConnection();
    this.#prompting = false;
    this.#status = "closed";
    this.#emit();
    this.#listeners.clear();
  }

  /** The current connection, captured per request so a failure is judged against its own socket. */
  #requireLink(): Link {
    if (!this.#connection || !this.#transport || this.#status === "closed") {
      throw new AgentDisconnectedError(this.#close);
    }
    return { connection: this.#connection, transport: this.#transport };
  }

  #requireSession(): string {
    if (!this.#sessionId) throw new AgentRequestError(INVALID_PARAMS, "No active session");
    return this.#sessionId;
  }

  /** Normalize a failed request; when the socket is going away, wait for its close code first. */
  async #failure(cause: unknown, link: Link): Promise<Error> {
    if (cause instanceof AgentRequestError || cause instanceof AgentDisconnectedError) return cause;
    if (isRpcError(cause)) return toAgentError(cause, null, true);
    const close = await Promise.race([link.transport.closed, delay(CLOSE_GRACE_MS)]);
    return toAgentError(cause, close, close === null && this.#connection === link.connection);
  }

  #dropConnection(): void {
    const transport = this.#transport;
    const connection = this.#connection;
    this.#transport = undefined;
    this.#connection = undefined;
    // Bump first so the old socket's close event is ignored.
    this.#generation += 1;
    connection?.close();
    transport?.close();
  }

  #onClosed(generation: number, info: CloseInfo): void {
    if (generation !== this.#generation) return;
    this.#connection = undefined;
    this.#transport = undefined;
    this.#close = info;
    this.#prompting = false;
    this.#cancelPermissions();
    if (this.#disposed) return;

    const description = describeClose(info.code);
    if (
      description.autoReconnect &&
      this.#options.reconnectOnExpiry !== false &&
      this.#sessionId !== null &&
      this.supportsLoad
    ) {
      this.#status = "reconnecting";
      this.#emit();
      // reconnect() leaves the status at "closed" (with the new close code) when it fails.
      this.reconnect().catch(() => {});
      return;
    }
    this.#status = "closed";
    this.#emit();
  }

  #onUpdate(notification: SessionNotification): void {
    if (notification.sessionId !== this.#sessionId) {
      this.#buffered?.push(notification);
      return;
    }
    this.#transcript = applySessionUpdate(this.#transcript, notification.update);
    this.#emit();
  }

  #requestPermission(params: RequestPermissionRequest, signal: AbortSignal): Promise<RequestPermissionResponse> {
    if (params.sessionId !== this.#sessionId) return Promise.resolve({ outcome: { outcome: "cancelled" } });
    // The prompt is about a tool call; make sure its card exists and shows what is asked.
    this.#transcript = applySessionUpdate(this.#transcript, { sessionUpdate: "tool_call_update", ...params.toolCall });
    return new Promise((resolve) => {
      const id = `perm-${++this.#permissionCounter}`;
      this.#permissions.set(id, {
        id,
        sessionId: params.sessionId,
        toolCall: params.toolCall,
        options: params.options,
        resolve,
      });
      // `$/cancel_request` from the agent, or the connection closing.
      signal.addEventListener(
        "abort",
        () => {
          this.#settlePermission(id, { outcome: { outcome: "cancelled" } });
          this.#emit();
        },
        { once: true }
      );
      this.#emit();
    });
  }

  #settlePermission(id: string, response: RequestPermissionResponse): void {
    const entry = this.#permissions.get(id);
    if (!entry) return;
    this.#permissions.delete(id);
    entry.resolve(response);
  }

  #cancelPermissions(sessionId?: string): void {
    for (const entry of this.#permissions.values()) {
      if (sessionId === undefined || entry.sessionId === sessionId) {
        this.#settlePermission(entry.id, { outcome: { outcome: "cancelled" } });
      }
    }
  }

  #buildSnapshot(): AgentChatSnapshot {
    return {
      status: this.#status,
      agentInfo: this.#agentInfo,
      capabilities: this.#capabilities,
      sessionId: this.#sessionId,
      transcript: this.#transcript,
      permissions: [...this.#permissions.values()].map(({ resolve: _resolve, ...pending }) => pending),
      prompting: this.#prompting,
      close: this.#close,
    };
  }

  #emit(): void {
    const model = modelOption(this.#transcript)?.currentValue;
    // A transcript without a model option is one being reset (a load in flight): keep the last choices.
    if (typeof model === "string") {
      const effort = effortOption(this.#transcript)?.currentValue;
      this.#choices = { initialModel: model, ...(typeof effort === "string" ? { initialEffort: effort } : {}) };
    }
    this.#snapshot = this.#buildSnapshot();
    for (const listener of this.#listeners) listener(this.#snapshot);
  }
}

function pickSetup(state: TranscriptState): Pick<TranscriptState, "modes" | "configOptions"> {
  return { modes: state.modes, configOptions: state.configOptions };
}

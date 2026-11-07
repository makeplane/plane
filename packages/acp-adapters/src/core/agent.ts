/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { randomUUID } from "node:crypto";
import path from "node:path";

import {
  PROTOCOL_VERSION,
  RequestError,
  agent,
  type AgentApp,
  type AgentContext,
  type ContentBlock,
  type Implementation,
  type ListSessionsResponse,
  type McpServer,
  type PromptCapabilities,
  type SessionConfigOption,
  type SessionModeState,
  type StopReason,
} from "@agentclientprotocol/sdk";

import { errorMessage, objectValue, stringValue } from "./json.ts";
import { EFFORT_ENV, INITIAL_EFFORT_META_KEY, INITIAL_MODEL_META_KEY, findModel, resolveEffort } from "./models.ts";
import { initialModeId, isPermissionModeId, sessionModeState, type PermissionModeId } from "./modes.ts";
import { PermissionGate } from "./permission.ts";
import { MessageWriter, ToolCallTracker, type Emit } from "./turn.ts";

export const MODEL_CONFIG_ID = "model";
/** The reasoning effort select, offered while the session's model takes one (ACP `thought_level`). */
export const EFFORT_CONFIG_ID = "effort";

export interface EffortChoice {
  readonly value: string;
  readonly name: string;
  readonly description?: string;
}

export interface ModelChoice {
  readonly value: string;
  readonly name: string;
  readonly description?: string;
  /** Reasoning effort levels the model takes, lowest first. Absent or empty: no effort select. */
  readonly efforts?: readonly EffortChoice[];
  /** The level a session starts on when nothing else is asked for; one of `efforts`. */
  readonly defaultEffort?: string;
}

export interface ModelCatalog {
  readonly options: readonly ModelChoice[];
  readonly current: string;
}

/** Everything an adapter session needs from the ACP side. */
export interface SessionHost {
  readonly sessionId: string;
  readonly cwd: string;
  readonly emit: Emit;
  readonly gate: PermissionGate;
  readonly toolCalls: ToolCallTracker;
  readonly client: AgentContext;
  readonly env: NodeJS.ProcessEnv;
  mode(): PermissionModeId;
  model(): string;
  /** The reasoning effort for the next turn; `undefined` when the model takes none. */
  effort(): string | undefined;
}

export interface SessionInit {
  readonly host: SessionHost;
  readonly mcpServers: readonly McpServer[];
}

export interface TurnContext {
  readonly prompt: readonly ContentBlock[];
  /**
   * Aborts on `session/cancel`, on `$/cancel_request` for this prompt and when the connection
   * closes. Providers must stop promptly; the core picks the right response.
   */
  readonly signal: AbortSignal;
  readonly turn: number;
  readonly messages: MessageWriter;
}

export interface AdapterSession {
  /**
   * Models for this session when they come from the provider itself (e.g. Codex `model/list`);
   * otherwise the adapter's `models()` is used.
   */
  readonly catalog?: ModelCatalog | undefined;
  /** Run one prompt turn and resolve with why it stopped. */
  prompt(turn: TurnContext): Promise<StopReason>;
  /** Called after `session/set_mode`, possibly mid-turn. The gate already reads the new mode. */
  setMode?(mode: PermissionModeId): void | Promise<void>;
  setModel?(model: string): void | Promise<void>;
  close?(): void | Promise<void>;
}

export interface AgentAdapter {
  readonly info: Implementation;
  readonly promptCapabilities?: PromptCapabilities;
  /**
   * Models offered as the `model` config option, read once per session before it starts. Optional
   * when every session supplies its own `catalog`.
   */
  models?(env: NodeJS.ProcessEnv): Promise<ModelCatalog> | ModelCatalog;
  startSession(init: SessionInit): Promise<AdapterSession>;
  /**
   * Resume a session from the provider's own storage. Replay its history through `host.emit` before
   * resolving. Present means `loadSession: true` is advertised.
   */
  loadSession?(init: SessionInit): Promise<AdapterSession>;
  /** Present means `sessionCapabilities.list` is advertised. */
  listSessions?(cwd: string | undefined, env: NodeJS.ProcessEnv): Promise<ListSessionsResponse>;
}

export interface CreateAgentOptions {
  readonly env?: NodeJS.ProcessEnv;
  /** Session id factory; tests make it deterministic. */
  readonly newSessionId?: () => string;
}

/** Why a turn's controller was aborted; decides between `stopReason: "cancelled"` and -32800. */
const SESSION_CANCEL = "session/cancel";
const REQUEST_CANCEL = "$/cancel_request";
const CONNECTION_CLOSED = "connection closed";

interface SessionState {
  readonly id: string;
  readonly host: SessionHost;
  readonly adapterSession: AdapterSession;
  mode: PermissionModeId;
  model: string;
  effort: string | undefined;
  catalog: ModelCatalog;
  turns: number;
  active: AbortController | undefined;
}

export interface AgentRuntime {
  readonly app: AgentApp;
  /** Number of requests being handled right now. */
  inflight(): number;
  /** Resolves when no request is in flight. */
  idle(): Promise<void>;
  /** Abort running turns and close every session (idempotent). */
  shutdown(): Promise<void>;
}

/**
 * Build the spec ACP agent around an adapter: `initialize`, `session/new|load`, `session/set_mode`,
 * `session/set_config_option` (model and effort), `session/prompt` and `session/cancel`.
 */
function selectOptions(choices: readonly (ModelChoice | EffortChoice)[]) {
  return choices.map((choice) =>
    choice.description
      ? { value: choice.value, name: choice.name, description: choice.description }
      : { value: choice.value, name: choice.name }
  );
}

export function createAgent(adapter: AgentAdapter, options: CreateAgentOptions = {}): AgentRuntime {
  const env = options.env ?? process.env;
  const newSessionId = options.newSessionId ?? randomUUID;
  const sessions = new Map<string, SessionState>();
  let inflight = 0;
  let idleWaiters: Array<() => void> = [];
  let closed = false;

  const track = async <T>(work: () => Promise<T>): Promise<T> => {
    inflight += 1;
    try {
      return await work();
    } finally {
      inflight -= 1;
      if (inflight === 0) {
        const waiters = idleWaiters;
        idleWaiters = [];
        for (const resolve of waiters) resolve();
      }
    }
  };

  const getSession = (sessionId: string): SessionState => {
    const session = sessions.get(sessionId);
    if (!session) throw RequestError.sessionNotFound(sessionId);
    return session;
  };

  /** The model select, then the effort select while the model takes one. */
  const sessionConfigOptions = (state: Pick<SessionState, "catalog" | "model" | "effort">): SessionConfigOption[] => {
    const result: SessionConfigOption[] = [
      {
        id: MODEL_CONFIG_ID,
        name: "Model",
        category: "model",
        type: "select",
        currentValue: state.model,
        options: selectOptions(state.catalog.options),
      },
    ];
    const efforts = findModel(state.catalog, state.model)?.efforts ?? [];
    if (state.effort && efforts.length > 0) {
      result.push({
        id: EFFORT_CONFIG_ID,
        name: "Reasoning",
        category: "thought_level",
        type: "select",
        currentValue: state.effort,
        options: selectOptions(efforts),
      });
    }
    return result;
  };

  const openSession = async (
    client: AgentContext,
    params: { sessionId?: string; cwd: string; mcpServers?: McpServer[]; _meta?: unknown },
    load: boolean
  ): Promise<{ sessionId: string; modes: SessionModeState; configOptions: SessionConfigOption[] }> => {
    if (!path.isAbsolute(params.cwd))
      throw RequestError.invalidParams({ cwd: params.cwd }, "cwd must be an absolute path");
    const sessionId = params.sessionId ?? newSessionId();
    if (sessions.has(sessionId)) throw RequestError.invalidParams({ sessionId }, "session is already open");
    const configured = adapter.models ? await adapter.models(env) : undefined;
    // The model and effort the browser last used with this agent, when the catalog has them.
    const meta = objectValue(params._meta);
    const requestedModel = stringValue(meta[INITIAL_MODEL_META_KEY]);
    const requestedEffort = stringValue(meta[INITIAL_EFFORT_META_KEY]);
    const startModel = (catalog: ModelCatalog) =>
      requestedModel && findModel(catalog, requestedModel) ? requestedModel : catalog.current;
    const startEffort = (catalog: ModelCatalog, model: string) =>
      resolveEffort(findModel(catalog, model), requestedEffort, env[EFFORT_ENV]?.trim());
    const mutable = {
      mode: initialModeId(params._meta, env),
      model: configured ? startModel(configured) : "",
      effort: undefined as string | undefined,
    };
    if (configured) mutable.effort = startEffort(configured, mutable.model);
    const emit: Emit = (update) => client.notify("session/update", { sessionId, update });
    const host: SessionHost = {
      sessionId,
      cwd: params.cwd,
      emit,
      client,
      env,
      gate: new PermissionGate(client, sessionId, () => mutable.mode),
      toolCalls: new ToolCallTracker(emit),
      mode: () => mutable.mode,
      model: () => mutable.model,
      effort: () => mutable.effort,
    };
    const init: SessionInit = { host, mcpServers: params.mcpServers ?? [] };
    let adapterSession: AdapterSession;
    try {
      adapterSession = load && adapter.loadSession ? await adapter.loadSession(init) : await adapter.startSession(init);
    } catch (error) {
      if (error instanceof RequestError) throw error;
      throw RequestError.internalError(undefined, errorMessage(error));
    }
    const catalog = adapterSession.catalog ?? configured;
    if (!catalog) throw RequestError.internalError({ message: "adapter offered no models" });
    if (adapterSession.catalog) {
      // The provider listed the models itself: start on the requested one if it offers it.
      mutable.model = adapterSession.catalog.current;
      const wanted = startModel(adapterSession.catalog);
      if (wanted !== mutable.model) {
        try {
          await adapterSession.setModel?.(wanted);
          mutable.model = wanted;
        } catch {
          // Keep the provider's own choice; the member can still switch in the chat.
        }
      }
      mutable.effort = startEffort(adapterSession.catalog, mutable.model);
    }
    const state: SessionState = {
      id: sessionId,
      host,
      adapterSession,
      catalog,
      turns: 0,
      active: undefined,
      get mode() {
        return mutable.mode;
      },
      set mode(value: PermissionModeId) {
        mutable.mode = value;
      },
      get model() {
        return mutable.model;
      },
      set model(value: string) {
        mutable.model = value;
      },
      get effort() {
        return mutable.effort;
      },
      set effort(value: string | undefined) {
        mutable.effort = value;
      },
    };
    sessions.set(sessionId, state);
    return { sessionId, modes: sessionModeState(state.mode), configOptions: sessionConfigOptions(state) };
  };

  const app = agent({ name: adapter.info.name })
    .onRequest("initialize", () =>
      track(async () => ({
        protocolVersion: PROTOCOL_VERSION,
        agentCapabilities: {
          loadSession: Boolean(adapter.loadSession),
          promptCapabilities: adapter.promptCapabilities ?? { image: false, audio: false, embeddedContext: true },
          mcpCapabilities: { http: true, sse: false },
          sessionCapabilities: adapter.listSessions ? { list: {} } : {},
        },
        authMethods: [],
        agentInfo: adapter.info,
      }))
    )
    .onRequest("session/new", ({ params, client }) =>
      track(async () => {
        const { sessionId, modes, configOptions } = await openSession(client, params, false);
        return { sessionId, modes, configOptions };
      })
    )
    .onRequest("session/set_mode", ({ params }) =>
      track(async () => {
        const session = getSession(params.sessionId);
        if (!isPermissionModeId(params.modeId)) {
          throw RequestError.invalidParams({ modeId: params.modeId }, "unknown mode");
        }
        session.mode = params.modeId;
        await session.adapterSession.setMode?.(params.modeId);
        return {};
      })
    )
    .onRequest("session/set_config_option", ({ params }) =>
      track(async () => {
        const session = getSession(params.sessionId);
        const value = params.value;
        if (params.configId === MODEL_CONFIG_ID) {
          const model = typeof value === "string" ? findModel(session.catalog, value) : undefined;
          if (!model) throw RequestError.invalidParams({ value }, "unknown model");
          await session.adapterSession.setModel?.(model.value);
          session.model = model.value;
          // Keep the effort when the new model takes it, else fall back to its default.
          session.effort = resolveEffort(model, session.effort, env[EFFORT_ENV]?.trim());
        } else if (params.configId === EFFORT_CONFIG_ID) {
          const efforts = findModel(session.catalog, session.model)?.efforts ?? [];
          if (typeof value !== "string" || !efforts.some((choice) => choice.value === value)) {
            throw RequestError.invalidParams({ value }, "unknown effort for this model");
          }
          session.effort = value;
        } else {
          throw RequestError.invalidParams({ configId: params.configId }, "unknown config option");
        }
        return { configOptions: sessionConfigOptions(session) };
      })
    )
    .onRequest("session/prompt", ({ params, signal }) =>
      track(async () => {
        const session = getSession(params.sessionId);
        if (session.active) throw RequestError.invalidRequest({ sessionId: session.id }, "a prompt is already running");
        const controller = new AbortController();
        const onRequestCancel = () => controller.abort(REQUEST_CANCEL);
        signal.addEventListener("abort", onRequestCancel, { once: true });
        session.active = controller;
        session.turns += 1;
        const turn: TurnContext = {
          prompt: params.prompt,
          signal: controller.signal,
          turn: session.turns,
          messages: new MessageWriter(session.host.emit, session.turns),
        };
        try {
          let stopReason: StopReason;
          try {
            stopReason = await session.adapterSession.prompt(turn);
          } catch (error) {
            if (!controller.signal.aborted) {
              await session.host.toolCalls.failOpen(errorMessage(error)).catch(() => {});
              throw error instanceof RequestError ? error : RequestError.internalError(undefined, errorMessage(error));
            }
            stopReason = "cancelled";
          }
          if (controller.signal.aborted) {
            await session.host.toolCalls.failOpen("cancelled").catch(() => {});
            // `$/cancel_request` is transport-level: the request itself is cancelled (-32800).
            // `session/cancel` is the business stop: the turn ends normally with `cancelled`.
            if (controller.signal.reason !== SESSION_CANCEL) throw RequestError.requestCancelled();
            return { stopReason: "cancelled" as const };
          }
          return { stopReason };
        } finally {
          signal.removeEventListener("abort", onRequestCancel);
          session.active = undefined;
        }
      })
    )
    .onNotification("session/cancel", ({ params }) => {
      sessions.get(params.sessionId)?.active?.abort(SESSION_CANCEL);
    });

  if (adapter.loadSession) {
    app.onRequest("session/load", ({ params, client }) =>
      track(async () => {
        const { modes, configOptions } = await openSession(client, params, true);
        return { modes, configOptions };
      })
    );
  }

  if (adapter.listSessions) {
    const listSessions = adapter.listSessions.bind(adapter);
    app.onRequest("session/list", ({ params }) => track(() => listSessions(params.cwd ?? undefined, env)));
  }

  return {
    app,
    inflight: () => inflight,
    idle: () => (inflight === 0 ? Promise.resolve() : new Promise<void>((resolve) => idleWaiters.push(resolve))),
    async shutdown() {
      if (closed) return;
      closed = true;
      for (const session of sessions.values()) session.active?.abort(CONNECTION_CLOSED);
      await Promise.allSettled([...sessions.values()].map((session) => session.adapterSession.close?.()));
      sessions.clear();
    },
  };
}

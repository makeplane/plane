/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* oxlint-disable no-await-in-loop -- session updates must reach the client in order */
import {
  agent,
  PROTOCOL_VERSION,
  RequestError,
  type AgentApp,
  type InitializeRequest,
  type LoadSessionRequest,
  type NewSessionRequest,
  type SessionConfigOption,
  type SessionModeState,
  type SessionUpdate,
} from "@agentclientprotocol/sdk";

const MODES = ["ask_all", "ask_writes", "yolo"] as const;

export interface FakeAgentOptions {
  readonly loadSession?: boolean;
  readonly listSessions?: boolean;
  /** Emulates the bridge's admin maximum: `set_mode` above it is answered -32602. */
  readonly maxMode?: (typeof MODES)[number];
  /** `false`: sessions offer no config options at all (no model to choose). */
  readonly models?: boolean;
  /** `session/new` fails as an agent with no usable credential does (ACP -32000). */
  readonly authRequired?: boolean;
}

interface FakeSession {
  readonly id: string;
  mode: string;
  model: string;
  /** Empty for a model with no effort levels. */
  effort: string;
  readonly history: SessionUpdate[];
  cancel?: () => void;
}

/** What the fake agent saw, for assertions. */
export interface FakeAgentLog {
  readonly initialize: InitializeRequest[];
  readonly newSession: NewSessionRequest[];
  readonly loaded: string[];
  readonly loadRequests: LoadSessionRequest[];
  readonly cancelled: string[];
}

function modeState(current: string, max: string): SessionModeState {
  const allowed = MODES.slice(0, MODES.indexOf(max as (typeof MODES)[number]) + 1);
  return { currentModeId: current, availableModes: allowed.map((id) => ({ id, name: id })) };
}

/** `fast` takes no effort; `smart` takes low/medium/high and starts on medium. */
const MODEL_EFFORTS: Record<string, readonly string[]> = { fast: [], smart: ["low", "medium", "high"] };

function effortFor(model: string, wanted: unknown): string {
  const levels = MODEL_EFFORTS[model] ?? [];
  if (typeof wanted === "string" && levels.includes(wanted)) return wanted;
  return levels.includes("medium") ? "medium" : "";
}

function configOptions(session: Pick<FakeSession, "model" | "effort">): SessionConfigOption[] {
  const options: SessionConfigOption[] = [
    {
      id: "model",
      name: "Model",
      category: "model",
      type: "select",
      currentValue: session.model,
      options: [
        { value: "fast", name: "Fast" },
        { value: "smart", name: "Smart" },
      ],
    },
  ];
  const levels = MODEL_EFFORTS[session.model] ?? [];
  if (session.effort && levels.length > 0) {
    options.push({
      id: "effort",
      name: "Reasoning",
      category: "thought_level",
      type: "select",
      currentValue: session.effort,
      options: levels.map((value) => ({ value, name: value })),
    });
  }
  return options;
}

/**
 * A deterministic ACP agent on the SDK's `agent()` builder, shared across connections so a
 * reconnect can `session/load` what the previous connection created. Prompts:
 * - anything: a thought, then the text echoed back in two chunks;
 * - `/tool`: a tool call gated by `session/request_permission`;
 * - `/sleep`: waits until `session/cancel`.
 * - `/plan`: a plan and a usage update; `/fail`: a JSON-RPC error.
 */
export function createFakeAgent(options: FakeAgentOptions = {}) {
  const sessions = new Map<string, FakeSession>();
  const log: FakeAgentLog = { initialize: [], newSession: [], loaded: [], loadRequests: [], cancelled: [] };
  const maxMode = options.maxMode ?? "yolo";
  let counter = 0;

  const app = (): AgentApp => {
    const built = agent({ name: "fake-agent" })
      .onRequest("initialize", ({ params }) => {
        log.initialize.push(params);
        return {
          protocolVersion: PROTOCOL_VERSION,
          agentCapabilities: {
            loadSession: options.loadSession ?? true,
            sessionCapabilities: options.listSessions ? { list: {} } : {},
          },
          agentInfo: { name: "fake-agent", title: "Fake", version: "1.0.0" },
          authMethods: [],
        };
      })
      .onRequest("session/new", ({ params }) => {
        log.newSession.push(params);
        if (options.authRequired) throw RequestError.authRequired(undefined, "there is no API key");
        const requested = params._meta?.["plane/initialModeId"];
        const mode = typeof requested === "string" ? requested : "ask_writes";
        const wantedModel = params._meta?.["plane/initialModel"];
        const model = typeof wantedModel === "string" && wantedModel in MODEL_EFFORTS ? wantedModel : "fast";
        const effort = effortFor(model, params._meta?.["plane/initialEffort"]);
        const session: FakeSession = { id: `session-${++counter}`, mode, model, effort, history: [] };
        sessions.set(session.id, session);
        return {
          sessionId: session.id,
          modes: modeState(mode, maxMode),
          configOptions: options.models === false ? [] : configOptions(session),
        };
      })
      .onRequest("session/list", () => ({
        sessions: [...sessions.values()].map((session) => ({ sessionId: session.id, cwd: "/w", title: session.id })),
      }))
      .onRequest("session/set_mode", ({ params }) => {
        const session = sessions.get(params.sessionId);
        const rank = MODES.indexOf(params.modeId as (typeof MODES)[number]);
        if (!session || rank === -1 || rank > MODES.indexOf(maxMode)) {
          throw RequestError.invalidParams({ modeId: params.modeId }, "mode not allowed");
        }
        session.mode = params.modeId;
        return {};
      })
      .onRequest("session/set_config_option", ({ params }) => {
        const session = sessions.get(params.sessionId);
        const value = String(params.value);
        if (session && params.configId === "model" && value in MODEL_EFFORTS) {
          session.model = value;
          session.effort = effortFor(value, session.effort);
        } else if (session && params.configId === "effort" && (MODEL_EFFORTS[session.model] ?? []).includes(value)) {
          session.effort = value;
        } else {
          throw RequestError.invalidParams({}, "unknown option");
        }
        return { configOptions: options.models === false ? [] : configOptions(session) };
      })
      .onRequest("session/prompt", async ({ params, client }) => {
        const session = sessions.get(params.sessionId);
        if (!session) throw RequestError.resourceNotFound(params.sessionId);
        const text = params.prompt.map((block) => (block.type === "text" ? block.text : "")).join("");
        const emit = async (update: SessionUpdate) => {
          session.history.push(update);
          await client.notify("session/update", { sessionId: session.id, update });
        };
        session.history.push({ sessionUpdate: "user_message_chunk", content: { type: "text", text } });

        if (text === "/sleep") {
          await new Promise<void>((resolve) => {
            session.cancel = resolve;
          });
          return { stopReason: "cancelled" as const };
        }
        if (text === "/fail") throw RequestError.internalError(undefined, "boom");
        if (text === "/plan") {
          await emit({
            sessionUpdate: "plan",
            entries: [{ content: "Answer", priority: "medium", status: "in_progress" }],
          });
          await emit({ sessionUpdate: "usage_update", used: 10, size: 100 });
          return { stopReason: "end_turn" as const };
        }
        if (text === "/tool") {
          await emit({
            sessionUpdate: "tool_call",
            toolCallId: "t1",
            title: "Run x",
            kind: "execute",
            status: "pending",
          });
          const answer = await client.request("session/request_permission", {
            sessionId: session.id,
            toolCall: { toolCallId: "t1", title: "Run x", rawInput: { command: "x" } },
            options: [
              { optionId: "allow_once", name: "Allow once", kind: "allow_once" },
              { optionId: "allow_always", name: "Always", kind: "allow_always" },
              { optionId: "reject_once", name: "Deny", kind: "reject_once" },
            ],
          });
          if (answer.outcome.outcome === "cancelled") return { stopReason: "cancelled" as const };
          const allowed = answer.outcome.optionId !== "reject_once";
          await emit({ sessionUpdate: "tool_call_update", toolCallId: "t1", status: allowed ? "completed" : "failed" });
          await emit({
            sessionUpdate: "agent_message_chunk",
            messageId: "m-tool",
            content: { type: "text", text: allowed ? "allowed" : "denied" },
          });
          return { stopReason: "end_turn" as const };
        }

        await emit({ sessionUpdate: "agent_thought_chunk", content: { type: "text", text: `mode ${session.mode}` } });
        const half = Math.ceil(text.length / 2);
        await emit({
          sessionUpdate: "agent_message_chunk",
          messageId: "m1",
          content: { type: "text", text: text.slice(0, half) },
        });
        await emit({
          sessionUpdate: "agent_message_chunk",
          messageId: "m1",
          content: { type: "text", text: text.slice(half) },
        });
        return { stopReason: "end_turn" as const };
      })
      .onNotification("session/cancel", ({ params }) => {
        log.cancelled.push(params.sessionId);
        sessions.get(params.sessionId)?.cancel?.();
      });

    if (options.loadSession ?? true) {
      built.onRequest("session/load", async ({ params, client }) => {
        const session = sessions.get(params.sessionId);
        if (!session) throw RequestError.resourceNotFound(params.sessionId);
        log.loaded.push(params.sessionId);
        log.loadRequests.push(params);
        // Like the real agents, a loaded session starts on the requested model and effort, else the defaults.
        const wantedModel = params._meta?.["plane/initialModel"];
        session.model = typeof wantedModel === "string" && wantedModel in MODEL_EFFORTS ? wantedModel : "fast";
        session.effort = effortFor(session.model, params._meta?.["plane/initialEffort"]);
        for (const update of session.history) await client.notify("session/update", { sessionId: session.id, update });
        return {
          modes: modeState(session.mode, maxMode),
          configOptions: options.models === false ? [] : configOptions(session),
        };
      });
    }
    return built;
  };

  return { app, log, sessions };
}

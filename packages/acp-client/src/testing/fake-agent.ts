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
}

interface FakeSession {
  readonly id: string;
  mode: string;
  model: string;
  readonly history: SessionUpdate[];
  cancel?: () => void;
}

/** What the fake agent saw, for assertions. */
export interface FakeAgentLog {
  readonly initialize: InitializeRequest[];
  readonly newSession: NewSessionRequest[];
  readonly loaded: string[];
  readonly cancelled: string[];
}

function modeState(current: string, max: string): SessionModeState {
  const allowed = MODES.slice(0, MODES.indexOf(max as (typeof MODES)[number]) + 1);
  return { currentModeId: current, availableModes: allowed.map((id) => ({ id, name: id })) };
}

function modelOption(current: string): SessionConfigOption {
  return {
    id: "model",
    name: "Model",
    category: "model",
    type: "select",
    currentValue: current,
    options: [
      { value: "fast", name: "Fast" },
      { value: "smart", name: "Smart" },
    ],
  };
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
  const log: FakeAgentLog = { initialize: [], newSession: [], loaded: [], cancelled: [] };
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
        const requested = params._meta?.["plane/initialModeId"];
        const mode = typeof requested === "string" ? requested : "ask_writes";
        const session: FakeSession = { id: `session-${++counter}`, mode, model: "fast", history: [] };
        sessions.set(session.id, session);
        return { sessionId: session.id, modes: modeState(mode, maxMode), configOptions: [modelOption(session.model)] };
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
        if (!session || params.configId !== "model") throw RequestError.invalidParams({}, "unknown option");
        session.model = String(params.value);
        return { configOptions: [modelOption(session.model)] };
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
        for (const update of session.history) await client.notify("session/update", { sessionId: session.id, update });
        return { modes: modeState(session.mode, maxMode), configOptions: [modelOption(session.model)] };
      });
    }
    return built;
  };

  return { app, log, sessions };
}

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* oxlint-disable no-await-in-loop -- session updates and tool calls must reach the client in order */
import type { StopReason } from "@agentclientprotocol/sdk";

import { sleep } from "../core/abort.ts";
import type { AgentAdapter, AdapterSession, SessionInit, TurnContext } from "../core/agent.ts";
import { agentInfo } from "../core/info.ts";
import { toolKindForCategory, type ToolCategory } from "../core/modes.ts";
import { promptToText } from "../core/turn.ts";

const CATEGORIES: readonly ToolCategory[] = [
  "read",
  "search",
  "fetch",
  "think",
  "execute",
  "edit",
  "delete",
  "move",
  "mcp_read",
  "mcp_write",
  "other",
];

/**
 * Deterministic test agent for the bridge and conformance tests. It echoes the prompt back, and a
 * few slash commands exercise the rest of the protocol:
 *
 * - `/tool <category> [title]` announces a tool call, runs it through the permission gate and
 *   reports `allowed` or `denied`.
 * - `/sleep <ms>` waits (cancellable), then echoes.
 * - `/plan`, `/usage` emit a plan or a usage update.
 * - `/fail` throws, to exercise error responses.
 */
export const echoAdapter: AgentAdapter = {
  info: agentInfo("plane-acp-echo", "Echo (test agent)"),
  models: () => ({ options: [{ value: "echo", name: "Echo" }], current: "echo" }),
  startSession: async (init) => new EchoSession(init),
};

class EchoSession implements AdapterSession {
  readonly #init: SessionInit;

  constructor(init: SessionInit) {
    this.#init = init;
  }

  async prompt(turn: TurnContext): Promise<StopReason> {
    const { host } = this.#init;
    const text = promptToText(turn.prompt).trim();
    const [command = "", ...args] = text.split(/\s+/);

    if (command === "/fail") throw new Error("echo agent failure requested");
    if (command === "/sleep") {
      await turn.messages.text("sleeping");
      turn.messages.breakMessage();
      await sleep(Number(args[0]) || 0, turn.signal);
      await turn.messages.text(`slept ${Number(args[0]) || 0}ms`);
      return "end_turn";
    }
    if (command === "/plan") {
      await host.emit({
        sessionUpdate: "plan",
        entries: [
          { content: "Read the request", priority: "high", status: "completed" },
          { content: "Answer it", priority: "medium", status: "in_progress" },
        ],
      });
      return "end_turn";
    }
    if (command === "/usage") {
      await host.emit({ sessionUpdate: "usage_update", used: 42, size: 1000 });
      return "end_turn";
    }
    if (command === "/tool") {
      const category = CATEGORIES.find((candidate) => candidate === args[0]) ?? "other";
      const title = args.slice(1).join(" ") || `echo ${category}`;
      const kind = toolKindForCategory(category);
      turn.messages.breakMessage();
      const toolCallId = await host.toolCalls.start(undefined, { title, kind, rawInput: { category } });
      const decision = await host.gate.check(
        { toolCallId, title, kind, category, rawInput: { category } },
        turn.signal
      );
      if (decision === "cancelled") return "cancelled";
      const allowed = decision === "allowed";
      await host.toolCalls.update(toolCallId, {
        status: allowed ? "completed" : "failed",
        content: [{ type: "content", content: { type: "text", text: allowed ? "ok" : "denied by user" } }],
      });
      turn.messages.breakMessage();
      await turn.messages.text(allowed ? "allowed" : "denied");
      return "end_turn";
    }

    await turn.messages.thought(`mode ${host.mode()}`);
    for (const word of text.split(/(?<=\s)/)) await turn.messages.text(word);
    return "end_turn";
  }
}

/** Deterministic session ids (`echo-session-1`, ...) so piped transcripts can address a session. */
export function echoSessionIds(): () => string {
  let next = 0;
  return () => `echo-session-${++next}`;
}

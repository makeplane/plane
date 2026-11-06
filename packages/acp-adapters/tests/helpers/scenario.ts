import type { McpServer } from "@agentclientprotocol/sdk";
import { expect } from "vitest";

import { textOf, updatesOfKind, type TestClient } from "./client.ts";

export interface ScenarioPrompts {
  /** Streams a reply with no tool call; `reply` is the full text expected. */
  readonly plain: { readonly text: string; readonly reply: string };
  /** A tool call that `ask_writes` gates (shell or write). */
  readonly gated: string;
  /** A tool call that `ask_writes` lets through (read or search). */
  readonly read: string;
  /** Streams something, then runs until cancelled. */
  readonly wait: string;
}

export interface ScenarioOptions {
  readonly agentName: string;
  readonly cwd: string;
  readonly prompts: ScenarioPrompts;
  readonly mcpServers?: McpServer[];
  /** A model id the agent offers, to switch to with `session/set_config_option`. */
  readonly otherModel?: string;
}

/**
 * The wire-level contract every adapter must meet, driven through the SDK `client()`:
 * initialize → session/new (modes + model config option) → streamed prompt → gated tool call
 * allowed and denied → set_mode changes gating → cancel mid-turn → model switch.
 */
export async function runWireScenario(client: TestClient, options: ScenarioOptions): Promise<string> {
  const { agent } = client;
  const init = await agent.request("initialize", {
    protocolVersion: 1,
    clientCapabilities: { fs: { readTextFile: false, writeTextFile: false }, terminal: false },
  });
  expect(init.protocolVersion).toBe(1);
  expect(init.agentInfo?.name).toBe(options.agentName);
  expect(init.agentCapabilities?.mcpCapabilities?.http).toBe(true);

  const session = await agent.request("session/new", { cwd: options.cwd, mcpServers: options.mcpServers ?? [] });
  const { sessionId } = session;
  expect(session.modes?.currentModeId).toBe("ask_writes");
  expect(session.modes?.availableModes.map((mode) => mode.id)).toEqual(["ask_all", "ask_writes", "yolo"]);
  const model = session.configOptions?.[0];
  expect(model).toMatchObject({ id: "model", category: "model", type: "select" });

  const prompt = (text: string) => agent.request("session/prompt", { sessionId, prompt: [{ type: "text", text }] });
  const since = (mark: number) =>
    client.updates.slice(mark).filter((notification) => notification.sessionId === sessionId);

  // Streamed reply: several chunks, one messageId per message.
  let mark = client.updates.length;
  expect((await prompt(options.prompts.plain.text)).stopReason).toBe("end_turn");
  const chunks = updatesOfKind(since(mark), "agent_message_chunk");
  expect(chunks.length).toBeGreaterThan(0);
  expect(textOf(since(mark), "agent_message_chunk")).toBe(options.prompts.plain.reply);
  expect(chunks.every((chunk) => typeof chunk.messageId === "string")).toBe(true);

  // A gated tool call, allowed.
  mark = client.updates.length;
  let asked = client.permissionRequests.length;
  client.answers.push("allow_once");
  expect((await prompt(options.prompts.gated)).stopReason).toBe("end_turn");
  expect(client.permissionRequests.length).toBe(asked + 1);
  const allowedCall = client.permissionRequests.at(-1)!.toolCall.toolCallId;
  expect(updatesOfKind(since(mark), "tool_call").some((call) => call.toolCallId === allowedCall)).toBe(true);
  expect(
    updatesOfKind(since(mark), "tool_call_update").findLast((update) => update.toolCallId === allowedCall)?.status
  ).toBe("completed");

  // The same tool call, denied.
  mark = client.updates.length;
  asked = client.permissionRequests.length;
  client.answers.push("reject_once");
  expect((await prompt(options.prompts.gated)).stopReason).toBe("end_turn");
  expect(client.permissionRequests.length).toBe(asked + 1);
  const deniedCall = client.permissionRequests.at(-1)!.toolCall.toolCallId;
  expect(
    updatesOfKind(since(mark), "tool_call_update").findLast((update) => update.toolCallId === deniedCall)?.status
  ).toBe("failed");

  // ask_writes lets reads through; ask_all asks; yolo never asks.
  asked = client.permissionRequests.length;
  expect((await prompt(options.prompts.read)).stopReason).toBe("end_turn");
  expect(client.permissionRequests.length).toBe(asked);

  await agent.request("session/set_mode", { sessionId, modeId: "ask_all" });
  client.answers.push("allow_once");
  expect((await prompt(options.prompts.read)).stopReason).toBe("end_turn");
  expect(client.permissionRequests.length).toBe(asked + 1);

  await agent.request("session/set_mode", { sessionId, modeId: "yolo" });
  asked = client.permissionRequests.length;
  expect((await prompt(options.prompts.gated)).stopReason).toBe("end_turn");
  expect(client.permissionRequests.length).toBe(asked);

  await expect(agent.request("session/set_mode", { sessionId, modeId: "root" })).rejects.toMatchObject({
    code: -32602,
  });

  // Cancel mid-turn: the business stop ends the turn with `cancelled`.
  mark = client.updates.length;
  const waiting = prompt(options.prompts.wait);
  await client.waitFor(() => updatesOfKind(since(mark), "agent_message_chunk").length > 0);
  await agent.notify("session/cancel", { sessionId });
  expect((await waiting).stopReason).toBe("cancelled");

  // The session is still usable after a cancel.
  expect((await prompt(options.prompts.plain.text)).stopReason).toBe("end_turn");

  if (options.otherModel) {
    const switched = await agent.request("session/set_config_option", {
      sessionId,
      configId: "model",
      value: options.otherModel,
    });
    expect(switched.configOptions[0]).toMatchObject({ id: "model", currentValue: options.otherModel });
    await expect(
      agent.request("session/set_config_option", { sessionId, configId: "model", value: "nope" })
    ).rejects.toMatchObject({
      code: -32602,
    });
  }
  return sessionId;
}

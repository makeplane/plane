/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { McpServer } from "@agentclientprotocol/sdk";
import { afterEach, describe, expect, it } from "vitest";

import { createDeepSeekAdapter, finishToStopReason } from "../src/deepseek/index.ts";
import { inProcessClient, tempDir, textOf, updatesOfKind, type InProcessClient } from "./helpers/client.ts";
import { deepSeekFetch } from "./helpers/deepseek.ts";

const env = { DEEPSEEK_API_KEY: "sk-deepseek" };

describe("DeepSeek tool loop (fetch-stubbed SSE)", () => {
  let client: InProcessClient | undefined;
  afterEach(async () => {
    await client?.close();
    client = undefined;
  });

  async function open(extraEnv: Record<string, string> = {}, mcpServers: McpServer[] = []) {
    const api = deepSeekFetch();
    client = inProcessClient(createDeepSeekAdapter({ fetch: api.fetch }), { ...env, ...extraEnv });
    await client.agent.request("initialize", { protocolVersion: 1 });
    const { sessionId } = await client.agent.request("session/new", {
      cwd: tempDir(),
      mcpServers,
      _meta: { "plane/initialModeId": "yolo" },
    });
    const prompt = (text: string) =>
      client!.agent.request("session/prompt", { sessionId, prompt: [{ type: "text", text }] });
    return { api, sessionId, prompt };
  }

  it("streams reasoning as thoughts and sends every reasoning_content back once tools are in play", async () => {
    const { api, prompt } = await open();
    expect((await prompt("hello")).stopReason).toBe("end_turn");
    expect(textOf(client!.updates, "agent_thought_chunk")).toBe("The user greets me.");
    expect(textOf(client!.updates, "agent_message_chunk")).toBe("Hi there");

    expect((await prompt("write")).stopReason).toBe("end_turn");
    // Request 2 is the tool-calling turn, request 3 follows the tool result.
    const followUp = api.requests[2]!.body.messages;
    const assistants = followUp.filter((message: any) => message.role === "assistant");
    expect(assistants.map((message: any) => message.reasoning_content)).toEqual([
      "The user greets me.",
      "I will call write.",
    ]);
    expect(assistants[1].tool_calls[0]).toMatchObject({ id: "call_w", type: "function", function: { name: "write" } });
    expect(followUp.at(-1)).toMatchObject({ role: "tool", tool_call_id: "call_w" });
    expect(api.requests[0]!.body).toMatchObject({
      stream: true,
      thinking: { type: "enabled" },
      model: "deepseek-v4-pro",
    });
    expect(api.requests[0]!.headers.get("authorization")).toBe("Bearer sk-deepseek");
  });

  it("maps finish reasons and stops at the iteration limit", async () => {
    expect(finishToStopReason("stop")).toBe("end_turn");
    expect(finishToStopReason("length")).toBe("max_tokens");
    expect(finishToStopReason("content_filter")).toBe("refusal");
    const { api, prompt } = await open({ PLANE_AGENT_MAX_ITERATIONS: "3" });
    expect((await prompt("long")).stopReason).toBe("max_tokens");
    expect((await prompt("filter")).stopReason).toBe("refusal");
    const before = api.requests.length;
    expect((await prompt("loop")).stopReason).toBe("max_turn_requests");
    expect(api.requests.length - before).toBe(3);
    expect(updatesOfKind(client!.updates, "usage_update").at(-1)).toMatchObject({ used: 120, size: 1_000_000 });
  });

  it("keeps history valid after a cancel and reports unreachable MCP servers once", async () => {
    const { api, prompt } = await open({}, [
      { type: "http", name: "plane", url: "http://127.0.0.1:9/mcp", headers: [] },
    ]);
    const waiting = prompt("wait");
    await client!.waitFor(() => textOf(client!.updates, "agent_message_chunk").includes("working"));
    await client!.agent.notify("session/cancel", { sessionId: client!.updates[0]!.sessionId });
    expect((await waiting).stopReason).toBe("cancelled");
    expect(updatesOfKind(client!.updates, "notice")).toEqual([
      expect.objectContaining({ severity: "warning", title: expect.stringContaining("MCP server unavailable: plane") }),
    ]);
    expect((await prompt("hello")).stopReason).toBe("end_turn");
    const roles = api.requests.at(-1)!.body.messages.map((message: any) => message.role);
    expect(roles).toEqual(["system", "user", "assistant", "user"]);
    expect(updatesOfKind(client!.updates, "notice")).toHaveLength(1);
  });

  it("runs shell commands without the agent's credentials", async () => {
    const { prompt } = await open({ PLANE_TOKEN: "plane_secret" });
    expect((await prompt("env")).stopReason).toBe("end_turn");
    const output = updatesOfKind(client!.updates, "tool_call_update").find(
      (update) => update.toolCallId === "call_env" && update.status === "completed"
    );
    expect(JSON.stringify(output?.content)).toContain("key=unset token=unset home=set");
  });

  it("requires an API key", async () => {
    client = inProcessClient(createDeepSeekAdapter({ fetch: deepSeekFetch().fetch }), {});
    await client.agent.request("initialize", { protocolVersion: 1 });
    await expect(client.agent.request("session/new", { cwd: tempDir(), mcpServers: [] })).rejects.toMatchObject({
      code: -32000,
      message: expect.stringContaining("DEEPSEEK_API_KEY"),
    });
  });
});

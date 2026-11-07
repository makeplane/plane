/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { statSync } from "node:fs";
import path from "node:path";

import type { McpServer } from "@agentclientprotocol/sdk";
import { afterEach, describe, expect, it } from "vitest";

import { spawnClient, tempDir, textOf, updatesOfKind, type SpawnedClient } from "./helpers/client.ts";
import { fakeCodexEnv } from "./helpers/codex.ts";
import { runWireScenario } from "./helpers/scenario.ts";

const planeMcp: McpServer = {
  type: "http",
  name: "plane",
  url: "http://mcp.internal/mcp",
  headers: [
    { name: "Authorization", value: "Bearer plane_api_token" },
    { name: "X-Workspace-slug", value: "acme" },
  ],
};

describe("plane-acp-codex over stdio (fake app-server)", () => {
  let client: SpawnedClient | undefined;
  afterEach(async () => {
    await client?.close();
    client = undefined;
  });

  it("meets the wire contract", async () => {
    const fake = fakeCodexEnv();
    client = spawnClient("codex", fake.env);
    await runWireScenario(client, {
      agentName: "plane-acp-codex",
      cwd: tempDir(),
      mcpServers: [planeMcp],
      prompts: { plain: { text: "hello", reply: "Hi there" }, gated: "run", read: "ls", wait: "wait" },
      otherModel: "gpt-mini",
    });

    const log = fake.log();
    const threadStart = log.find((message) => message.method === "thread/start")?.params as Record<string, unknown>;
    expect(threadStart).toMatchObject({
      approvalPolicy: "untrusted",
      sandbox: "danger-full-access",
      config: {
        mcp_servers: {
          plane: {
            url: "http://mcp.internal/mcp",
            http_headers: { Authorization: "Bearer plane_api_token", "X-Workspace-slug": "acme" },
            default_tools_approval_mode: "prompt",
          },
        },
        shell_environment_policy: {
          ignore_default_excludes: false,
          exclude: expect.arrayContaining(["*KEY*", "*TOKEN*"]),
        },
      },
    });
    const policies = log
      .filter((message) => message.method === "turn/start")
      .map((message) => (message.params as any).approvalPolicy);
    expect(policies).toContain("untrusted");
    expect(policies).toContain("on-request");
    expect(log.some((message) => message.method === "turn/interrupt")).toBe(true);
    const replies = log
      .filter((message) => typeof message.id === "string" && "result" in message)
      .map((message) => (message.result as any).decision);
    expect(replies).toEqual(expect.arrayContaining(["accept", "decline"]));
  });

  it("gates Plane MCP calls through elicitation and streams thoughts, plans and usage", async () => {
    const fake = fakeCodexEnv();
    client = spawnClient("codex", fake.env);
    await client.agent.request("initialize", { protocolVersion: 1 });
    const { sessionId, configOptions } = await client.agent.request("session/new", {
      cwd: tempDir(),
      mcpServers: [planeMcp],
    });
    expect(configOptions?.[0]).toMatchObject({ currentValue: "gpt-test" });
    expect((configOptions?.[0] as any)?.options.map((option: any) => option.value)).toEqual(["gpt-test", "gpt-mini"]);

    await client.agent.request("session/prompt", { sessionId, prompt: [{ type: "text", text: "hello" }] });
    expect(textOf(client.updates, "agent_thought_chunk")).toBe("Thinking.");
    expect(updatesOfKind(client.updates, "usage_update")[0]).toMatchObject({ used: 120, size: 400000 });

    client.answers.push("reject_once");
    await client.agent.request("session/prompt", { sessionId, prompt: [{ type: "text", text: "plane" }] });
    expect(client.permissionRequests.at(-1)?.toolCall).toMatchObject({ title: "plane: workitem create", kind: "edit" });
    expect(textOf(client.updates, "agent_message_chunk")).toContain("not created");
    const elicitationReply = fake.log().find((message) => message.id === "srv-1");
    expect(elicitationReply?.result).toMatchObject({ action: "decline" });

    // An approved MCP call is reported on the card its approval opened: one card, completed.
    client.answers.push("allow_once");
    const before = client.updates.length;
    await client.agent.request("session/prompt", { sessionId, prompt: [{ type: "text", text: "plane" }] });
    const approvalCard = client.permissionRequests.at(-1)!.toolCall.toolCallId;
    const turnUpdates = client.updates.slice(before);
    expect(updatesOfKind(turnUpdates, "tool_call").map((call) => call.toolCallId)).toEqual([approvalCard]);
    expect(
      updatesOfKind(turnUpdates, "tool_call_update").findLast((update) => update.toolCallId === approvalCard)
    ).toMatchObject({
      status: "completed",
      content: [{ type: "content", content: { type: "text", text: "created T" } }],
    });
  });

  it("signs in with OPENAI_API_KEY and fails clearly without credentials", async () => {
    const signedOut = fakeCodexEnv({ FAKE_CODEX_SIGNED_IN: "0", OPENAI_API_KEY: "" });
    client = spawnClient("codex", signedOut.env);
    await client.agent.request("initialize", { protocolVersion: 1 });
    await expect(client.agent.request("session/new", { cwd: tempDir(), mcpServers: [] })).rejects.toMatchObject({
      code: -32000,
      message: expect.stringMatching(/Workspace settings → AI providers.*OPENAI_API_KEY/),
    });
    await client.close();

    const withKey = fakeCodexEnv({ FAKE_CODEX_SIGNED_IN: "0", OPENAI_API_KEY: "sk-test" });
    client = spawnClient("codex", withKey.env);
    await client.agent.request("initialize", { protocolVersion: 1 });
    await client.agent.request("session/new", { cwd: tempDir(), mcpServers: [] });
    expect(withKey.log().find((message) => message.method === "account/login/start")?.params).toEqual({
      type: "apiKey",
      apiKey: "sk-test",
    });
  });

  it("uses the ChatGPT sign-in in ~/.codex with PLANE_AGENT_AUTH=chatgpt and never logs in with a key", async () => {
    const fake = fakeCodexEnv({ PLANE_AGENT_AUTH: "chatgpt", FAKE_CODEX_ACCOUNT: "chatgpt", OPENAI_API_KEY: "sk-x" });
    client = spawnClient("codex", fake.env);
    await client.agent.request("initialize", { protocolVersion: 1 });
    await client.agent.request("session/new", { cwd: tempDir(), mcpServers: [] });
    const log = fake.log();
    expect(log[0]?.start).toEqual({ codexHome: path.join(fake.env.HOME!, ".codex"), apiKeyInEnv: false });
    expect(log.some((message) => message.method === "account/login/start")).toBe(false);
    await client.close();

    // Signed in with a key only: ChatGPT is not connected.
    const keyOnly = fakeCodexEnv({ PLANE_AGENT_AUTH: "chatgpt" });
    client = spawnClient("codex", keyOnly.env);
    await client.agent.request("initialize", { protocolVersion: 1 });
    await expect(client.agent.request("session/new", { cwd: tempDir(), mcpServers: [] })).rejects.toMatchObject({
      code: -32000,
      message: expect.stringContaining(
        "ChatGPT is not connected. Sign in with ChatGPT in Workspace settings → AI providers."
      ),
    });
    expect(keyOnly.log().some((message) => message.method === "account/login/start")).toBe(false);
  });

  it("logs in with the current key in a separate CODEX_HOME, even when already signed in", async () => {
    for (const mode of ["api_key", ""]) {
      /* oxlint-disable no-await-in-loop -- one app-server per mode, in turn */
      const fake = fakeCodexEnv({ PLANE_AGENT_AUTH: mode, FAKE_CODEX_ACCOUNT: "chatgpt", OPENAI_API_KEY: "sk-new" });
      client = spawnClient("codex", fake.env);
      await client.agent.request("initialize", { protocolVersion: 1 });
      await client.agent.request("session/new", { cwd: tempDir(), mcpServers: [] });
      const codexHome = path.join(fake.env.HOME!, ".codex-api-key");
      const log = fake.log();
      expect(log[0]?.start).toEqual({ codexHome, apiKeyInEnv: true });
      expect(statSync(codexHome).mode & 0o777).toBe(0o700);
      expect(log.find((message) => message.method === "account/login/start")?.params).toEqual({
        type: "apiKey",
        apiKey: "sk-new",
      });
      await client.close();
      /* oxlint-enable no-await-in-loop */
    }

    const noKey = fakeCodexEnv({ PLANE_AGENT_AUTH: "api_key" });
    client = spawnClient("codex", noKey.env);
    await client.agent.request("initialize", { protocolVersion: 1 });
    await expect(client.agent.request("session/new", { cwd: tempDir(), mcpServers: [] })).rejects.toMatchObject({
      message: expect.stringContaining("Workspace settings → AI providers"),
    });
  });

  it("fails a stalled turn with the watchdog and surfaces MCP startup failures", async () => {
    const fake = fakeCodexEnv({ PLANE_CODEX_STALL_TIMEOUT_MS: "300", FAKE_CODEX_BROKEN_MCP: "1" });
    client = spawnClient("codex", fake.env);
    await client.agent.request("initialize", { protocolVersion: 1 });
    const { sessionId } = await client.agent.request("session/new", { cwd: tempDir(), mcpServers: [] });
    await expect(
      client.agent.request("session/prompt", { sessionId, prompt: [{ type: "text", text: "wait" }] })
    ).rejects.toMatchObject({
      message: expect.stringContaining("stalled"),
    });
    expect(updatesOfKind(client.updates, "notice")[0]).toMatchObject({ title: "MCP server broken failed to start" });
    expect(fake.log().some((message) => message.method === "turn/interrupt")).toBe(true);
  });
});

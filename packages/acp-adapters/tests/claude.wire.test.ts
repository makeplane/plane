import { afterEach, describe, expect, it } from "vitest";

import { createClaudeAdapter } from "../src/claude/index.ts";
import { inProcessClient, tempDir, textOf, updatesOfKind, type InProcessClient } from "./helpers/client.ts";
import { fakeQuery } from "./helpers/claude.ts";
import { runWireScenario } from "./helpers/scenario.ts";

const env = { ANTHROPIC_API_KEY: "sk-ant-test" };

describe("plane-acp-claude over ndjson (mocked query())", () => {
  let client: InProcessClient | undefined;
  afterEach(async () => {
    await client?.close();
    client = undefined;
  });

  it("meets the wire contract", async () => {
    const fake = fakeQuery();
    client = inProcessClient(createClaudeAdapter({ query: fake.query as never }), env);
    const sessionId = await runWireScenario(client, {
      agentName: "plane-acp-claude",
      cwd: tempDir(),
      mcpServers: [
        { type: "http", name: "plane", url: "http://mcp/mcp", headers: [{ name: "Authorization", value: "Bearer t" }] },
      ],
      prompts: { plain: { text: "hello", reply: "Hi there" }, gated: "run", read: "read", wait: "wait" },
      otherModel: "claude-sonnet-5-5",
    });

    const [first, second] = fake.calls;
    expect(first?.options).toMatchObject({
      model: "claude-opus-5-5",
      includePartialMessages: true,
      permissionMode: "default",
      settingSources: [],
      sessionId,
      mcpServers: { plane: { type: "http", url: "http://mcp/mcp", headers: { Authorization: "Bearer t" } } },
    });
    expect(first?.options.resume).toBeUndefined();
    expect(first?.options.env).toMatchObject({
      CLAUDE_CODE_SUBPROCESS_ENV_SCRUB: "1",
      ANTHROPIC_API_KEY: "sk-ant-test",
    });
    expect(second?.options.resume).toBe("00000000-0000-4000-8000-000000000001");
    expect(fake.calls.some((call) => call.options.permissionMode === "bypassPermissions")).toBe(true);
    expect(textOf(client.updates, "agent_thought_chunk")).toContain("Hmm.");
    expect(updatesOfKind(client.updates, "usage_update")[0]).toMatchObject({
      used: 120,
      size: 1_000_000,
      cost: { amount: 0.0123, currency: "USD" },
    });
  });

  it("maps TodoWrite to a plan and max_tokens to its stop reason, and requires credentials", async () => {
    const fake = fakeQuery();
    client = inProcessClient(createClaudeAdapter({ query: fake.query as never }), env);
    await client.agent.request("initialize", { protocolVersion: 1 });
    const { sessionId } = await client.agent.request("session/new", { cwd: tempDir(), mcpServers: [] });
    await client.agent.request("session/prompt", { sessionId, prompt: [{ type: "text", text: "todo" }] });
    expect(updatesOfKind(client.updates, "plan")[0]?.entries).toEqual([
      { content: "Plan it", priority: "medium", status: "in_progress" },
    ]);
    expect(client.permissionRequests).toHaveLength(0);
    expect(
      (await client.agent.request("session/prompt", { sessionId, prompt: [{ type: "text", text: "long" }] })).stopReason
    ).toBe("max_tokens");
    await client.close();

    client = inProcessClient(createClaudeAdapter({ query: fake.query as never }), {});
    await client.agent.request("initialize", { protocolVersion: 1 });
    await expect(client.agent.request("session/new", { cwd: tempDir(), mcpServers: [] })).rejects.toMatchObject({
      code: -32000,
    });
  });

  it("loads a stored session by replaying its history", async () => {
    const fake = fakeQuery();
    const stored = [
      {
        type: "user",
        uuid: "1",
        session_id: "s",
        parent_tool_use_id: null,
        parent_agent_id: null,
        message: { role: "user", content: "earlier question" },
      },
      {
        type: "assistant",
        uuid: "2",
        session_id: "s",
        parent_tool_use_id: null,
        parent_agent_id: null,
        message: { role: "assistant", content: [{ type: "text", text: "earlier answer" }] },
      },
    ];
    const adapter = createClaudeAdapter({
      query: fake.query as never,
      getSessionMessages: (async () => stored) as never,
      listSessions: (async () => [
        { sessionId: "11111111-1111-4111-8111-111111111111", summary: "Earlier", lastModified: 0 },
      ]) as never,
    });
    client = inProcessClient(adapter, env);
    const init = await client.agent.request("initialize", { protocolVersion: 1 });
    expect(init.agentCapabilities).toMatchObject({ loadSession: true, sessionCapabilities: { list: {} } });
    const sessionId = "11111111-1111-4111-8111-111111111111";
    const loaded = await client.agent.request("session/load", { sessionId, cwd: tempDir(), mcpServers: [] });
    expect(loaded.modes?.currentModeId).toBe("ask_writes");
    expect(textOf(client.updates, "agent_message_chunk")).toBe("earlier answer");
    expect(updatesOfKind(client.updates, "user_message_chunk")[0]?.content).toEqual({
      type: "text",
      text: "earlier question",
    });
    await client.agent.request("session/prompt", { sessionId, prompt: [{ type: "text", text: "hello" }] });
    expect(fake.calls[0]?.options.resume).toBe(sessionId);
    const listed = await client.agent.request("session/list", {});
    expect(listed.sessions[0]).toMatchObject({ sessionId, title: "Earlier" });
  });
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { execFileSync } from "node:child_process";
import { chmodSync, writeFileSync } from "node:fs";
import path from "node:path";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { GEMINI_CLI_VERSION } from "../src/gemini/index.ts";
import { spawnClient, tempDir, textOf, type SpawnedClient } from "./helpers/client.ts";
import { geminiApiServer } from "./helpers/gemini-api.ts";
import { planeMcpServer } from "./helpers/mcp-server.ts";
import { runWireScenario } from "./helpers/scenario.ts";

/**
 * The adapter against the real Gemini CLI, with a local fake Gemini API instead of Google (no key,
 * no network). Opt in with the CLI's entry point:
 *
 *   npm i --prefix /tmp/gem @google/gemini-cli@0.65.0
 *   PLANE_GEMINI_CLI=/tmp/gem/node_modules/@google/gemini-cli/bundle/gemini.js pnpm test gemini.real
 */
const BUNDLE = process.env.PLANE_GEMINI_CLI;

describe.skipIf(!BUNDLE)("plane-acp-gemini against the real Gemini CLI", () => {
  let api: Awaited<ReturnType<typeof geminiApiServer>>;
  let mcp: Awaited<ReturnType<typeof planeMcpServer>>;
  let client: SpawnedClient | undefined;
  let env: Record<string, string>;
  beforeAll(async () => {
    api = await geminiApiServer();
    mcp = await planeMcpServer();
    const bin = tempDir("real-gemini-");
    writeFileSync(path.join(bin, "gemini"), `#!/bin/sh\nexec "${process.execPath}" "${BUNDLE}" "$@"\n`);
    chmodSync(path.join(bin, "gemini"), 0o755);
    env = {
      PATH: `${bin}${path.delimiter}${process.env.PATH ?? ""}`,
      HOME: tempDir("real-gemini-home-"),
      GEMINI_API_KEY: "AIza-fake-key",
      GOOGLE_GEMINI_BASE_URL: api.url,
      // A fixed model: "auto" would first ask a classifier model to pick one.
      PLANE_AGENT_MODEL: "gemini-2.5-pro",
      PLANE_AGENT_AUTH: "",
    };
  });
  afterAll(async () => {
    await api.close();
    await mcp.close();
  });
  afterEach(async () => {
    await client?.close();
    client = undefined;
  });

  it(`is Gemini CLI ${GEMINI_CLI_VERSION}`, () => {
    expect(execFileSync(process.execPath, [BUNDLE!, "--version"], { encoding: "utf8" }).trim()).toBe(
      GEMINI_CLI_VERSION
    );
  });

  it("meets the wire contract, gates every tool call and resumes the session", { timeout: 120_000 }, async () => {
    const cwd = tempDir("real-gemini-cwd-");
    writeFileSync(path.join(cwd, "a.txt"), "hi\n");
    client = spawnClient("gemini", env);
    const planeMcp = {
      type: "http" as const,
      name: "plane",
      url: mcp.url,
      headers: [
        { name: "Authorization", value: "Bearer plane_api_token" },
        { name: "X-Workspace-slug", value: "acme" },
      ],
    };
    const sessionId = await runWireScenario(client, {
      agentName: "plane-acp-gemini",
      cwd,
      mcpServers: [planeMcp],
      prompts: {
        plain: { text: "hello", reply: "Hi there" },
        gated: 'CALL:write_file|{"file_path":"b.txt","content":"x"}',
        read: 'CALL:read_file|{"file_path":"a.txt"}',
        wait: "WAIT",
      },
      otherModel: "gemini-2.5-pro",
    });
    expect(api.requests.every((request) => request.apiKey === "AIza-fake-key")).toBe(true);
    const tools = api.requests.at(-1)?.tools ?? [];
    expect(tools).toContain("mcp_plane_workitem");
    for (const hidden of ["ask_user", "enter_plan_mode", "invoke_agent", "get_internal_docs"]) {
      expect(tools).not.toContain(hidden);
    }

    // Shell "known safe" commands still ask (the admin policy defeats Gemini's heuristics).
    await client.agent.request("session/set_mode", { sessionId, modeId: "ask_writes" });
    const asked = client.permissionRequests.length;
    client.answers.push("allow_once");
    await client.agent.request("session/prompt", {
      sessionId,
      prompt: [{ type: "text", text: 'CALL:run_shell_command|{"command":"ls"}' }],
    });
    expect(client.permissionRequests.length).toBe(asked + 1);

    // Plane MCP: a list runs, a create asks; both reach the server with the bridge's headers.
    await client.agent.request("session/prompt", {
      sessionId,
      prompt: [{ type: "text", text: 'CALL:mcp_plane_workitem|{"action":"list"}' }],
    });
    expect(client.permissionRequests.length).toBe(asked + 1);
    client.answers.push("allow_once");
    await client.agent.request("session/prompt", {
      sessionId,
      prompt: [{ type: "text", text: 'CALL:mcp_plane_workitem|{"action":"create","name":"T"}' }],
    });
    expect(client.permissionRequests.at(-1)?.toolCall.title).toBe("workitem(action: create, name: T)");
    expect(mcp.calls.map((call) => [call.args.action, call.authorization, call.workspace])).toEqual([
      ["list", "Bearer plane_api_token", "acme"],
      ["create", "Bearer plane_api_token", "acme"],
    ]);

    // Gemini's own slash commands do not run.
    const mark = client.updates.length;
    await client.agent.request("session/prompt", { sessionId, prompt: [{ type: "text", text: "/about" }] });
    expect(textOf(client.updates.slice(mark), "agent_message_chunk")).toBe("ok");
    await client.close();

    client = spawnClient("gemini", env);
    await client.agent.request("initialize", { protocolVersion: 1 });
    await client.agent.request("session/load", { sessionId, cwd, mcpServers: [] });
    const replayed = client.updates.filter((notification) => notification.sessionId === sessionId);
    const users = replayed.flatMap(({ update }) =>
      update.sessionUpdate === "user_message_chunk" && update.content.type === "text" ? [update.content.text] : []
    );
    expect(users[0]).toBe("hello");
    expect(users.some((text) => text.startsWith("<session_context>"))).toBe(false);
    expect(textOf(replayed, "agent_message_chunk")).toContain("Hi there");
  });
});

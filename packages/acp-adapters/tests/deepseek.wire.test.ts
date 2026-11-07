/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { spawnClient, tempDir, type SpawnedClient } from "./helpers/client.ts";
import { deepSeekServer } from "./helpers/deepseek.ts";
import { planeMcpServer } from "./helpers/mcp-server.ts";
import { runWireScenario } from "./helpers/scenario.ts";

describe("plane-acp-deepseek over stdio (local SSE + MCP servers)", () => {
  let api: Awaited<ReturnType<typeof deepSeekServer>>;
  let mcp: Awaited<ReturnType<typeof planeMcpServer>>;
  let client: SpawnedClient | undefined;
  beforeAll(async () => {
    api = await deepSeekServer();
    mcp = await planeMcpServer();
  });
  afterAll(async () => {
    await api.close();
    await mcp.close();
  });
  afterEach(async () => {
    await client?.close();
    client = undefined;
  });

  it("meets the wire contract with built-in and Plane MCP tools", async () => {
    const cwd = tempDir();
    client = spawnClient("deepseek", { DEEPSEEK_API_KEY: "sk-deepseek", DEEPSEEK_BASE_URL: api.url });
    await runWireScenario(client, {
      agentName: "plane-acp-deepseek",
      cwd,
      mcpServers: [
        {
          type: "http",
          name: "plane",
          url: mcp.url,
          headers: [
            { name: "Authorization", value: "Bearer plane_api_token" },
            { name: "X-Workspace-slug", value: "acme" },
          ],
        },
      ],
      prompts: { plain: { text: "hello", reply: "Hi there" }, gated: "write", read: "plane list", wait: "wait" },
      otherModel: "deepseek-flash",
    });

    expect(readFileSync(path.join(cwd, "out.txt"), "utf8")).toBe("hello file");
    expect(mcp.calls.length).toBeGreaterThan(0);
    expect(mcp.calls[0]).toMatchObject({
      tool: "workitem",
      args: { action: "list" },
      authorization: "Bearer plane_api_token",
      workspace: "acme",
    });
    expect(api.requests[0].authorization).toBe("Bearer sk-deepseek");
    expect(api.requests[0].url).toBe("/chat/completions");
    expect(api.requests.at(-1).body.model).toBe("deepseek-v4-pro");
    const tools = api.requests[0].body.tools.map((tool: any) => tool.function.name);
    expect(tools).toEqual(
      expect.arrayContaining([
        "bash",
        "read",
        "write",
        "edit",
        "glob",
        "grep",
        "web_fetch",
        "todo",
        "mcp__plane__workitem",
      ])
    );
  });
});

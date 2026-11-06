/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { afterEach, describe, expect, it } from "vitest";

import { spawnClient, tempDir, updatesOfKind, type SpawnedClient } from "./helpers/client.ts";
import { runWireScenario } from "./helpers/scenario.ts";

describe("plane-acp-echo over stdio", () => {
  let client: SpawnedClient | undefined;
  afterEach(async () => {
    await client?.close();
    client = undefined;
  });

  it("meets the wire contract", async () => {
    client = spawnClient("echo");
    await runWireScenario(client, {
      agentName: "plane-acp-echo",
      cwd: tempDir(),
      prompts: {
        plain: { text: "hello wide world", reply: "hello wide world" },
        gated: "/tool execute Run it",
        read: "/tool read Read it",
        wait: "/sleep 10000",
      },
    });
  });

  it("answers $/cancel_request with -32800 and session/cancel with stopReason cancelled", async () => {
    client = spawnClient("echo");
    await client.agent.request("initialize", { protocolVersion: 1 });
    const { sessionId } = await client.agent.request("session/new", { cwd: tempDir(), mcpServers: [] });
    const cancelled = new AbortController();
    const viaRequest = client.agent.request(
      "session/prompt",
      { sessionId, prompt: [{ type: "text", text: "/sleep 10000" }] },
      {
        cancellationSignal: cancelled.signal,
      }
    );
    setTimeout(() => cancelled.abort(), 50);
    await expect(viaRequest).rejects.toMatchObject({ code: -32800 });

    const viaSession = client.agent.request("session/prompt", {
      sessionId,
      prompt: [{ type: "text", text: "/sleep 10000" }],
    });
    setTimeout(() => void client!.agent.notify("session/cancel", { sessionId }), 50);
    expect((await viaSession).stopReason).toBe("cancelled");
  });

  it("starts in the mode the bridge asks for and emits plans and usage", async () => {
    client = spawnClient("echo", { PLANE_AGENT_DEFAULT_MODE: "ask_all" });
    await client.agent.request("initialize", { protocolVersion: 1 });
    const fromEnv = await client.agent.request("session/new", { cwd: tempDir(), mcpServers: [] });
    expect(fromEnv.modes?.currentModeId).toBe("ask_all");
    const fromMeta = await client.agent.request("session/new", {
      cwd: tempDir(),
      mcpServers: [],
      _meta: { "plane/initialModeId": "yolo" },
    });
    expect(fromMeta.modes?.currentModeId).toBe("yolo");
    await client.agent.request("session/prompt", {
      sessionId: fromMeta.sessionId,
      prompt: [{ type: "text", text: "/plan" }],
    });
    await client.agent.request("session/prompt", {
      sessionId: fromMeta.sessionId,
      prompt: [{ type: "text", text: "/usage" }],
    });
    expect(updatesOfKind(client.updates, "plan")[0]?.entries).toHaveLength(2);
    expect(updatesOfKind(client.updates, "usage_update")[0]).toMatchObject({ used: 42, size: 1000 });
    await expect(client.agent.request("session/new", { cwd: "relative/dir", mcpServers: [] })).rejects.toMatchObject({
      code: -32602,
    });
    await expect(
      client.agent.request("session/prompt", { sessionId: "missing", prompt: [{ type: "text", text: "hi" }] })
    ).rejects.toMatchObject({ code: -32002 });
  });
});

describe("plane-acp-echo process lifecycle", () => {
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    it(`drains and exits on ${signal}`, async () => {
      const client = spawnClient("echo");
      await client.agent.request("initialize", { protocolVersion: 1 });
      const started = Date.now();
      const exited = new Promise<number | null>((resolve) => client.child.once("exit", (code) => resolve(code)));
      client.child.kill(signal);
      expect(await exited).toBe(0);
      expect(Date.now() - started).toBeLessThan(2_000);
      expect(client.stderr()).toBe("");
    });
  }
});

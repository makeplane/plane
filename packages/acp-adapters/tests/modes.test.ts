/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { AgentContext } from "@agentclientprotocol/sdk";
import { describe, expect, it } from "vitest";

import { describeClaudeTool } from "../src/claude/index.ts";
import { approvalPolicyFor, commandCategory } from "../src/codex/index.ts";
import {
  PERMISSION_MODE_IDS,
  classifyMcpCall,
  initialModeId,
  requiresPermission,
  sessionModeState,
  type ToolCategory,
} from "../src/core/modes.ts";
import { PermissionGate } from "../src/core/permission.ts";

const ALL: readonly ToolCategory[] = [
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

describe("mode gate", () => {
  it("advertises exactly the three levels, least to most permissive", () => {
    expect(PERMISSION_MODE_IDS).toEqual(["ask_all", "ask_writes", "yolo"]);
    expect(sessionModeState("yolo").availableModes.map((mode) => mode.id)).toEqual(["ask_all", "ask_writes", "yolo"]);
    expect(sessionModeState("yolo").currentModeId).toBe("yolo");
  });

  it("ask_writes lets reads, search, web fetches and Plane reads through", () => {
    for (const category of ["read", "search", "fetch", "think", "mcp_read"] as const) {
      expect(requiresPermission("ask_writes", category), category).toBe(false);
    }
  });

  it("ask_writes prompts for shell, writes and Plane MCP mutations", () => {
    for (const category of ["execute", "edit", "delete", "move", "mcp_write", "other"] as const) {
      expect(requiresPermission("ask_writes", category), category).toBe(true);
    }
  });

  it("yolo never prompts and ask_all always does", () => {
    for (const category of ALL) {
      expect(requiresPermission("yolo", category), category).toBe(false);
      expect(requiresPermission("ask_all", category), category).toBe(true);
    }
  });

  it("starts in the mode the bridge requests, then the env default, then ask_writes", () => {
    expect(initialModeId({ "plane/initialModeId": "yolo" }, { PLANE_AGENT_DEFAULT_MODE: "ask_all" })).toBe("yolo");
    expect(initialModeId({ "plane/initialModeId": "bogus" }, { PLANE_AGENT_DEFAULT_MODE: "ask_all" })).toBe("ask_all");
    expect(initialModeId(undefined, {})).toBe("ask_writes");
  });
});

describe("MCP call classification", () => {
  it("follows the Plane MCP action convention and fails closed", () => {
    for (const action of ["list", "list_archived", "retrieve", "retrieve_by_identifier", "search", "count", "get"]) {
      expect(classifyMcpCall("workitem", { action }), action).toBe("mcp_read");
    }
    for (const action of ["create", "update", "delete", "archive", "manage_label", "something_new"]) {
      expect(classifyMcpCall("workitem", { action }), action).toBe("mcp_write");
    }
    expect(classifyMcpCall("get_pql_reference", {})).toBe("mcp_read");
    expect(classifyMcpCall("workitem", {})).toBe("mcp_write");
    expect(classifyMcpCall("anything", { action: "create" }, { readOnlyHint: true })).toBe("mcp_read");
  });
});

describe("provider mappings", () => {
  it("maps permission levels to Codex approval policies", () => {
    expect(approvalPolicyFor("ask_all")).toBe("untrusted");
    expect(approvalPolicyFor("ask_writes")).toBe("untrusted");
    expect(approvalPolicyFor("yolo")).toBe("on-request");
  });

  it("treats a Codex command as a read only when every parsed action is one", () => {
    expect(commandCategory([{ type: "read" }])).toBe("read");
    expect(commandCategory([{ type: "listFiles" }, { type: "search" }])).toBe("search");
    expect(commandCategory([{ type: "read" }, { type: "unknown" }])).toBe("execute");
    expect(commandCategory([])).toBe("execute");
  });

  it("classifies Claude Code tools", () => {
    expect(describeClaudeTool("Read", { file_path: "a.ts" }, "/w")).toMatchObject({
      category: "read",
      locations: [{ path: "/w/a.ts" }],
    });
    expect(describeClaudeTool("Bash", { command: "git status" }, "/w")).toMatchObject({
      category: "execute",
      memoryKey: "Bash:git",
    });
    expect(describeClaudeTool("Edit", { file_path: "/x" }, "/w").category).toBe("edit");
    expect(describeClaudeTool("WebFetch", { url: "https://x" }, "/w").category).toBe("fetch");
    expect(describeClaudeTool("mcp__plane__workitem", { action: "list" }, "/w")).toMatchObject({
      category: "mcp_read",
      title: "plane: workitem list",
    });
    expect(describeClaudeTool("mcp__plane__workitem", { action: "delete" }, "/w").category).toBe("mcp_write");
  });
});

describe("PermissionGate", () => {
  function gate(mode: "ask_all" | "ask_writes" | "yolo", answers: string[]) {
    const requests: unknown[] = [];
    const client = {
      request: async (_method: string, params: unknown) => {
        requests.push(params);
        const optionId = answers.shift();
        return optionId === "cancelled"
          ? { outcome: { outcome: "cancelled" } }
          : { outcome: { outcome: "selected", optionId } };
      },
    } as unknown as AgentContext;
    let current = mode;
    return {
      gate: new PermissionGate(client, "s1", () => current),
      requests,
      setMode: (next: typeof mode) => (current = next),
    };
  }
  const check = {
    toolCallId: "t1",
    title: "Run: ls",
    kind: "execute" as const,
    category: "execute" as const,
    memoryKey: "Bash:ls",
  };
  const signal = new AbortController().signal;

  it("asks with allow once / always / deny and honours the answer", async () => {
    const { gate: g, requests } = gate("ask_writes", ["allow_once", "reject_once"]);
    expect(await g.check(check, signal)).toBe("allowed");
    expect(await g.check(check, signal)).toBe("rejected");
    expect(requests).toHaveLength(2);
    expect(requests[0]).toMatchObject({
      sessionId: "s1",
      toolCall: { toolCallId: "t1", status: "pending", kind: "execute" },
      options: [
        { optionId: "allow_once", kind: "allow_once" },
        { optionId: "allow_always", kind: "allow_always" },
        { optionId: "reject_once", kind: "reject_once" },
      ],
    });
  });

  it("remembers allow_always for the session, per memory key", async () => {
    const { gate: g, requests } = gate("ask_all", ["allow_always", "allow_once"]);
    expect(await g.check(check, signal)).toBe("allowed");
    expect(await g.check(check, signal)).toBe("allowed");
    expect(requests).toHaveLength(1);
    expect(await g.check({ ...check, memoryKey: "Bash:rm" }, signal)).toBe("allowed");
    expect(requests).toHaveLength(2);
  });

  it("reads the mode live and reports a cancelled prompt", async () => {
    const { gate: g, requests, setMode } = gate("ask_writes", ["cancelled"]);
    setMode("yolo");
    expect(await g.check(check, signal)).toBe("allowed");
    expect(requests).toHaveLength(0);
    setMode("ask_writes");
    expect(await g.check(check, signal)).toBe("cancelled");
    const aborted = new AbortController();
    aborted.abort();
    expect(await g.check(check, aborted.signal)).toBe("cancelled");
  });
});

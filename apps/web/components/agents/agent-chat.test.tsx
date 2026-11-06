/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PendingPermission, ToolCallItem } from "@plane/acp-client";
import { AgentChatComposer } from "./composer";
import { PermissionPrompt } from "./permission-prompt";
import { ToolCallCard } from "./transcript/tool-call-card";

const PERMISSION: PendingPermission = {
  id: "perm-1",
  sessionId: "s1",
  toolCall: { toolCallId: "t1", title: "Run ls" },
  options: [
    { optionId: "allow_once", name: "Allow once", kind: "allow_once" },
    { optionId: "allow_always", name: "Always", kind: "allow_always" },
    { optionId: "reject_once", name: "Deny", kind: "reject_once" },
  ],
};

const TOOL_CALL: ToolCallItem = {
  kind: "tool_call",
  id: "i1",
  toolCallId: "t1",
  title: "Run ls",
  toolKind: "execute",
  status: "pending",
  content: [],
  locations: [],
  rawInput: { command: "ls" },
};

describe("PermissionPrompt", () => {
  it("offers allow once, always and deny, and answers with the chosen option", async () => {
    const onRespond = vi.fn();
    render(<PermissionPrompt permission={PERMISSION} onRespond={onRespond} />);
    expect(await screen.findByRole("group", { name: "Allow this action?" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Always allow in this chat" }));
    await userEvent.click(screen.getByRole("button", { name: "Deny" }));
    expect(onRespond.mock.calls).toEqual([
      ["perm-1", "allow_always"],
      ["perm-1", "reject_once"],
    ]);
    expect(screen.getByRole("button", { name: "Allow once" })).toBeTruthy();
  });
});

describe("ToolCallCard", () => {
  it("shows the title, the status and an inline permission prompt", async () => {
    const onRespond = vi.fn();
    render(<ToolCallCard item={TOOL_CALL} permission={PERMISSION} onRespondToPermission={onRespond} />);
    expect(await screen.findByText("Pending")).toBeTruthy();
    expect(screen.getByText("Run ls")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Allow once" }));
    expect(onRespond).toHaveBeenCalledWith("perm-1", "allow_once");
  });

  it("shows the input when expanded", async () => {
    render(<ToolCallCard item={{ ...TOOL_CALL, status: "completed" }} onRespondToPermission={vi.fn()} />);
    await userEvent.click(await screen.findByRole("button", { name: /Run ls/ }));
    expect(await screen.findByText(/"command": "ls"/)).toBeTruthy();
    expect(screen.getByText("Done")).toBeTruthy();
  });
});

describe("AgentChatComposer", () => {
  it("sends on Enter, adds a line on Shift+Enter and clears after sending", async () => {
    const onSend = vi.fn();
    render(<AgentChatComposer agentName="Claude" canPrompt prompting={false} onSend={onSend} onStop={vi.fn()} />);
    const input = await screen.findByRole("textbox", { name: "Message" });
    await userEvent.type(input, "hello{Shift>}{Enter}{/Shift}there");
    expect(onSend).not.toHaveBeenCalled();
    await userEvent.type(input, "{Enter}");
    expect(onSend).toHaveBeenCalledWith("hello\nthere");
    expect((input as HTMLTextAreaElement).value).toBe("");
  });

  it("does not send while it cannot prompt", async () => {
    const onSend = vi.fn();
    render(
      <AgentChatComposer agentName="Claude" canPrompt={false} prompting={false} onSend={onSend} onStop={vi.fn()} />
    );
    await userEvent.type(await screen.findByRole("textbox", { name: "Message" }), "hi{Enter}");
    expect(onSend).not.toHaveBeenCalled();
    expect((screen.getByRole("button", { name: "Send" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows Stop while a turn runs", async () => {
    const onStop = vi.fn();
    render(<AgentChatComposer agentName="Claude" canPrompt={false} prompting onSend={vi.fn()} onStop={onStop} />);
    await userEvent.click(await screen.findByRole("button", { name: "Stop" }));
    expect(onStop).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "Send" })).toBeNull();
  });
});

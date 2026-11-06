/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentChatSession } from "@plane/acp-client";
import { createFakeAgent, memoryTransport } from "@plane/acp-client/testing";
import type { TWorkspaceAgent } from "@plane/types";
import { AgentChatStore } from "@/store/agent-chat.store";
import { isAgentsPage, KhaiaWidget } from "./root";

const AGENTS: TWorkspaceAgent[] = [
  {
    id: "agent-1",
    name: "Claude",
    slug: "claude",
    description: "Anthropic's agent",
    adapter: "claude",
    default_permission_level: "ask_writes",
    max_permission_level: "ask_writes",
  },
  {
    id: "agent-2",
    name: "Codex",
    slug: "codex",
    description: "",
    adapter: "codex",
    default_permission_level: "ask_all",
    max_permission_level: "yolo",
  },
];

// Outside the app, i18next runs without the ICU plugin, so "{name}" stays in the labels.
const OPEN = /^Open (Khaia|\{name\})$/;
const UNREAD = /^Open (Khaia|\{name\}) \(new activity\)$/;

let store: AgentChatStore;
vi.mock("@/hooks/store/use-agent-chat", () => ({ useAgentChat: () => store }));

function setup(agents: TWorkspaceAgent[] = AGENTS) {
  const fake = createFakeAgent({ maxMode: "ask_writes" });
  const targets: { agentId: string; workspaceSlug: string }[] = [];
  store = new AgentChatStore({
    agentService: { list: async () => agents },
    createSession: (target) => {
      targets.push(target);
      return new AgentChatSession({ transport: () => memoryTransport(fake.app()) });
    },
  });
  return { targets };
}

function renderWidget(path = "/acme/projects/") {
  return render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <MemoryRouter initialEntries={[path]}>
        <KhaiaWidget workspaceSlug="acme" />
      </MemoryRouter>
    </SWRConfig>
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => store?.closeChat());

describe("isAgentsPage", () => {
  it("matches the full chat page of the same workspace only", () => {
    expect(isAgentsPage("/acme/agents", "acme")).toBe(true);
    expect(isAgentsPage("/acme/agents/", "acme")).toBe(true);
    expect(isAgentsPage("/acme/agents-team/", "acme")).toBe(false);
    expect(isAgentsPage("/acme/projects/", "acme")).toBe(false);
    expect(isAgentsPage("/other/agents/", "acme")).toBe(false);
  });
});

describe("KhaiaWidget", () => {
  it("shows the bubble, and connects only once the window opens", async () => {
    const { targets } = setup();
    renderWidget();
    const bubble = await screen.findByRole("button", { name: OPEN });
    expect(targets).toEqual([]);

    await userEvent.click(bubble);
    expect(await screen.findByRole("dialog", { name: /^Chat with/ })).toBeTruthy();
    expect(screen.getByText(/^Hi, I'm/)).toBeTruthy();
    expect(targets).toEqual([{ agentId: "agent-1", workspaceSlug: "acme" }]);
  });

  it("sends a suggestion and shows the reply", async () => {
    setup();
    renderWidget();
    await userEvent.click(await screen.findByRole("button", { name: OPEN }));
    const suggestion = await screen.findByRole("button", { name: "What's assigned to me?" });
    await waitFor(() => expect((suggestion as HTMLButtonElement).disabled).toBe(false));
    await userEvent.click(suggestion);
    await waitFor(() => expect(store.snapshot?.prompting).toBe(false));
    expect(screen.getAllByText(/What's assigned to me\?/).length).toBeGreaterThan(1);
  });

  it("minimizes on Escape, and flags replies that arrive while minimized", async () => {
    setup();
    renderWidget();
    await userEvent.click(await screen.findByRole("button", { name: OPEN }));
    const input = await screen.findByRole("textbox", { name: "Message" });
    await waitFor(() => expect(store.canPrompt).toBe(true));
    expect(document.activeElement).toBe(input);

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: OPEN }));

    await act(() => store.sendPrompt("hello"));
    expect(await screen.findByRole("button", { name: UNREAD })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: UNREAD }));
    expect(await screen.findByRole("dialog", { name: /^Chat with/ })).toBeTruthy();
    // The window takes the bubble's place, and minimizing brings the bubble back without the dot.
    expect(screen.queryByRole("button", { name: UNREAD })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Minimize" }));
    expect(await screen.findByRole("button", { name: OPEN })).toBeTruthy();
  });

  it("switches agents from the header menu", async () => {
    const { targets } = setup();
    renderWidget();
    await userEvent.click(await screen.findByRole("button", { name: OPEN }));
    await userEvent.click(await screen.findByRole("button", { name: /^Switch agent/ }));
    await userEvent.click(await screen.findByRole("menuitemradio", { name: /Codex/ }));
    await waitFor(() => expect(store.agentId).toBe("agent-2"));
    expect(targets.at(-1)).toEqual({ agentId: "agent-2", workspaceSlug: "acme" });
    expect(localStorage.length).toBeGreaterThan(0);
  });

  it("stays hidden on the full chat page and when the workspace has no agents", async () => {
    setup();
    const { unmount } = renderWidget("/acme/agents/");
    await waitFor(() => expect(store.getWorkspaceAgents("acme")).toEqual(AGENTS));
    expect(screen.queryByRole("button", { name: OPEN })).toBeNull();
    unmount();

    setup([]);
    renderWidget();
    await waitFor(() => expect(store.getWorkspaceAgents("acme")).toEqual([]));
    expect(screen.queryByRole("button", { name: OPEN })).toBeNull();
  });
});

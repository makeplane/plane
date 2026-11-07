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
    credential_source: "workspace",
  },
  {
    id: "agent-2",
    name: "Codex",
    slug: "codex",
    description: "",
    adapter: "codex",
    default_permission_level: "ask_all",
    max_permission_level: "yolo",
    credential_source: "personal",
  },
  {
    id: "agent-3",
    name: "Gemini",
    slug: "gemini",
    description: "",
    adapter: "gemini",
    default_permission_level: "ask_writes",
    max_permission_level: "ask_writes",
    credential_source: null,
  },
];

// Outside the app, i18next runs without the ICU plugin, so "{name}" stays in the labels.
const OPEN = /^Open (Khaia|\{name\})$/;
const UNREAD = /^Open (Khaia|\{name\}) \(new activity\)$/;

let store: AgentChatStore;
vi.mock("@/hooks/store/use-agent-chat", () => ({ useAgentChat: () => store }));
// Admins and members may open AI providers; flip to false to act as a guest.
let canManageProviders = true;
vi.mock("@/hooks/store/user", () => ({
  useUserPermissions: () => ({ allowPermissions: () => canManageProviders }),
}));

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

beforeEach(() => {
  localStorage.clear();
  canManageProviders = true;
});
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

  it("switches agents from the composer picker, with agents that have no key disabled", async () => {
    const { targets } = setup();
    renderWidget();
    await userEvent.click(await screen.findByRole("button", { name: OPEN }));
    await waitFor(() => expect(store.canPrompt).toBe(true));
    await userEvent.click(screen.getByRole("button", { name: /^Agent and model/ }));
    const gemini = await screen.findByRole("menuitemradio", { name: /Gemini/ });
    expect(gemini.getAttribute("aria-disabled")).toBe("true");
    expect(gemini.textContent).toContain("No API key yet");
    expect(screen.getByRole("menuitem", { name: "Manage AI providers" })).toBeTruthy();
    await userEvent.click(gemini);
    expect(store.agentId).toBe("agent-1");
    await userEvent.click(screen.getByRole("menuitemradio", { name: /Codex/ }));
    await waitFor(() => expect(store.agentId).toBe("agent-2"));
    // Picking closes the menu.
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(targets.at(-1)).toEqual({ agentId: "agent-2", workspaceSlug: "acme" });
    expect(localStorage.getItem("agent_chat_last_agent:acme")).toBe("agent-2");
  });

  it("switches the model in the same chat, and the effort once the model takes one", async () => {
    const { targets } = setup();
    renderWidget();
    await userEvent.click(await screen.findByRole("button", { name: OPEN }));
    await waitFor(() => expect(store.canPrompt).toBe(true));
    // The fake agent's "fast" model takes no effort, so there is no effort menu yet.
    expect(screen.queryByRole("button", { name: /^Reasoning effort/ })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /^Agent and model/ }));
    await userEvent.click(await screen.findByRole("menuitemradio", { name: "Smart" }));
    await waitFor(() => expect(store.modelConfig?.currentValue).toBe("smart"));
    expect(targets).toHaveLength(1);

    await userEvent.click(await screen.findByRole("button", { name: /^Reasoning effort/ }));
    await userEvent.click(await screen.findByRole("menuitemradio", { name: "High" }));
    await waitFor(() => expect(store.effortConfig?.currentValue).toBe("high"));
    expect(JSON.parse(localStorage.getItem("agent_chat_choices:acme:agent-1") ?? "{}")).toEqual({
      model: "smart",
      effort: "high",
    });
  });

  it("hides the AI providers link from guests and locks switching while the agent answers", async () => {
    canManageProviders = false;
    setup();
    renderWidget();
    await userEvent.click(await screen.findByRole("button", { name: OPEN }));
    await waitFor(() => expect(store.canPrompt).toBe(true));
    const turn = store.sendPrompt("/sleep");
    await waitFor(() => expect(store.snapshot?.prompting).toBe(true));
    await userEvent.click(screen.getByRole("button", { name: /^Agent and model/ }));
    expect((await screen.findByRole("menuitemradio", { name: /Codex/ })).getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByRole("menuitemradio", { name: "Smart" }).getAttribute("aria-disabled")).toBe("true");
    expect(screen.queryByRole("menuitem", { name: "Manage AI providers" })).toBeNull();
    await userEvent.keyboard("{Escape}");
    await act(() => store.cancelTurn());
    await turn;
  });

  it("shows a plain label when there is only one agent and no model to choose", async () => {
    store = new AgentChatStore({
      agentService: { list: async () => [AGENTS[0]!] },
      createSession: () =>
        new AgentChatSession({
          transport: () => memoryTransport(createFakeAgent({ maxMode: "ask_writes", models: false }).app()),
        }),
    });
    renderWidget();
    await userEvent.click(await screen.findByRole("button", { name: OPEN }));
    await waitFor(() => expect(store.canPrompt).toBe(true));
    expect(screen.queryByRole("button", { name: /^Agent and model/ })).toBeNull();
    // The header and the plain label both name the agent.
    expect(screen.getAllByText("Claude")).toHaveLength(2);
  });

  it("offers AI providers instead of a retry when the agent cannot sign in", async () => {
    const list = vi.fn(async () => AGENTS);
    store = new AgentChatStore({
      agentService: { list },
      createSession: () =>
        new AgentChatSession({
          transport: () => memoryTransport(createFakeAgent({ maxMode: "ask_writes", authRequired: true }).app()),
        }),
    });
    renderWidget();
    await userEvent.click(await screen.findByRole("button", { name: OPEN }));
    expect(await screen.findByRole("button", { name: "Manage AI providers" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    // The list is fetched again: the agent's key or sign-in may have gone.
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
  });

  it("opens with a usable agent when the remembered one has no key", async () => {
    localStorage.setItem("agent_chat_last_agent:acme", "agent-3");
    const { targets } = setup();
    renderWidget();
    await userEvent.click(await screen.findByRole("button", { name: OPEN }));
    await waitFor(() => expect(targets).toEqual([{ agentId: "agent-1", workspaceSlug: "acme" }]));
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

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TAgentConnectionStatus, TAgentProviderEntry } from "@plane/types";
import { AgentProviderCard } from "./provider-card";
import type { TAgentProviderCardActions } from "./provider-card";
import { AgentProviderSignInDialog } from "./sign-in-dialog";

const entry = (patch: Partial<TAgentProviderEntry> = {}): TAgentProviderEntry => ({
  provider: "openai",
  personal: null,
  workspace: null,
  instance_configured: false,
  can_manage_workspace: false,
  ...patch,
});

const actions = (patch: Partial<TAgentProviderCardActions> = {}): TAgentProviderCardActions => ({
  setApiKey: vi.fn(async (provider) => entry({ provider })),
  removeCredential: vi.fn(async () => undefined),
  disconnectAccount: vi.fn(async () => undefined),
  onEntryChange: vi.fn(),
  refresh: vi.fn(async () => undefined),
  ...patch,
});

describe("AgentProviderCard", () => {
  it("shows the Claude note and only an API key action for Anthropic", async () => {
    render(<AgentProviderCard entry={entry({ provider: "anthropic" })} workspaceSlug="acme" actions={actions()} />);
    expect(await screen.findByRole("heading", { name: "Anthropic · Claude" })).toBeTruthy();
    expect(screen.getByText(/Claude uses an Anthropic API key/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add API key" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Sign in with/ })).toBeNull();
    expect(screen.getByText(/No key yet/)).toBeTruthy();
  });

  it("shows a member the workspace key read-only and the instance default line", async () => {
    render(
      <AgentProviderCard
        entry={entry({ provider: "google", instance_configured: true })}
        workspaceSlug="acme"
        actions={actions()}
      />
    );
    expect(await screen.findByRole("button", { name: "Sign in with Google" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add workspace key" })).toBeNull();
    expect(screen.getByText("Only workspace admins can change this.")).toBeTruthy();
    expect(screen.getByText("Uses the instance default.")).toBeTruthy();
  });

  it("shows the signed-in account and disconnects it", async () => {
    const cardActions = actions();
    render(
      <AgentProviderCard
        entry={entry({
          personal: { method: "chatgpt", secret_hint: "", account_label: "me@example.com", updated_at: "" },
          workspace: { method: "api_key", secret_hint: "wxyz", updated_at: "" },
          can_manage_workspace: true,
        })}
        workspaceSlug="acme"
        actions={cardActions}
      />
    );
    // The test i18n setup leaves {placeholders} uninterpolated, so match the static part.
    expect(await screen.findByText(/^Signed in as/)).toBeTruthy();
    expect(screen.getByText(/^API key ••••/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Replace: Workspace key" })).toBeTruthy();
    expect(screen.queryByText(/instance default\./)).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    const dialog = await screen.findByRole("alertdialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Disconnect" }));
    await waitFor(() => expect(cardActions.disconnectAccount).toHaveBeenCalledWith("openai"));
    expect(cardActions.refresh).toHaveBeenCalled();
  });

  it("validates and saves a personal API key", async () => {
    const cardActions = actions();
    render(<AgentProviderCard entry={entry()} workspaceSlug="acme" actions={cardActions} />);
    await userEvent.click(await screen.findByRole("button", { name: "Add API key" }));
    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByLabelText(/API key/, { selector: "input" });
    await userEvent.type(input, "short");
    await userEvent.click(screen.getByRole("button", { name: "Save key" }));
    expect(await screen.findByText("Enter a key of 8 to 512 characters, with no spaces.")).toBeTruthy();
    expect(cardActions.setApiKey).not.toHaveBeenCalled();
    await userEvent.clear(input);
    await userEvent.type(input, "sk-proj-12345678");
    await userEvent.click(screen.getByRole("button", { name: "Save key" }));
    await waitFor(() => expect(cardActions.setApiKey).toHaveBeenCalledWith("openai", "personal", "sk-proj-12345678"));
    expect(cardActions.onEntryChange).toHaveBeenCalled();
  });
});

describe("AgentProviderSignInDialog", () => {
  it("shows the ChatGPT device code and polls until connected", async () => {
    const statuses: TAgentConnectionStatus[] = [
      { status: "pending" },
      { status: "connected", account: { email: "me@example.com" } },
    ];
    const service = {
      start: vi.fn(async () => ({
        loginId: "l1",
        verificationUrl: "https://auth.openai.com/codex/device",
        userCode: "ABCD-1234",
        needsCode: false,
      })),
      status: vi.fn(async () => statuses.shift() ?? { status: "pending" as const }),
      complete: vi.fn(),
    };
    const onConnected = vi.fn();
    render(
      <AgentProviderSignInDialog
        provider="openai"
        workspaceSlug="acme"
        onClose={vi.fn()}
        onConnected={onConnected}
        service={service}
        pollIntervalMs={5}
      />
    );
    expect(await screen.findByText("ABCD-1234")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open ChatGPT sign-in" }).getAttribute("href")).toBe(
      "https://auth.openai.com/codex/device"
    );
    await waitFor(() => expect(onConnected).toHaveBeenCalledWith({ email: "me@example.com" }));
    expect(service.start).toHaveBeenCalledWith("openai", "acme");
    expect(service.status).toHaveBeenCalledWith("openai", "acme", "l1", expect.any(AbortSignal));
  });

  it("stops polling when cancelled", async () => {
    const service = {
      start: vi.fn(async () => ({ loginId: "l1", verificationUrl: "https://x.test", userCode: "C", needsCode: false })),
      status: vi.fn(async () => ({ status: "pending" as const })),
      complete: vi.fn(),
    };
    const onClose = vi.fn();
    const { unmount } = render(
      <AgentProviderSignInDialog
        provider="openai"
        workspaceSlug="acme"
        onClose={onClose}
        onConnected={vi.fn()}
        service={service}
        pollIntervalMs={5}
      />
    );
    await waitFor(() => expect(service.status).toHaveBeenCalled());
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
    unmount();
    const calls = service.status.mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(service.status.mock.calls.length).toBe(calls);
  });

  it("sends the pasted Google code and reports a bad one", async () => {
    const service = {
      start: vi.fn(async () => ({
        loginId: "g1",
        verificationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        needsCode: true,
      })),
      status: vi.fn(),
      complete: vi
        .fn()
        .mockResolvedValueOnce({ status: "failed", error: "invalid_grant" })
        .mockResolvedValueOnce({ status: "connected", account: { email: "g@example.com" } }),
    };
    const onConnected = vi.fn();
    render(
      <AgentProviderSignInDialog
        provider="google"
        workspaceSlug="acme"
        onClose={vi.fn()}
        onConnected={onConnected}
        service={service}
      />
    );
    const input = await screen.findByRole("textbox", { name: /Code/ });
    await userEvent.click(screen.getByRole("button", { name: "Connect" }));
    expect(await screen.findByText("Paste the code from Google.")).toBeTruthy();
    await userEvent.type(input, " 4/abc ");
    await userEvent.click(screen.getByRole("button", { name: "Connect" }));
    expect(await screen.findByText("Sign-in failed.")).toBeTruthy();
    expect(screen.getByText("invalid_grant")).toBeTruthy();
    expect(service.complete).toHaveBeenCalledWith("google", "acme", "g1", "4/abc");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(service.start).toHaveBeenCalledTimes(2));
    await userEvent.type(await screen.findByRole("textbox", { name: /Code/ }), "4/def");
    await userEvent.click(screen.getByRole("button", { name: "Connect" }));
    await waitFor(() => expect(onConnected).toHaveBeenCalledWith({ email: "g@example.com" }));
    expect(service.status).not.toHaveBeenCalled();
  });
});

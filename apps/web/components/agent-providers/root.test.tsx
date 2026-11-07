/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { describe, expect, it, vi } from "vitest";
import type { TAgentProviderEntry } from "@plane/types";

const mocks = vi.hoisted(() => ({ list: vi.fn(), account: vi.fn(), setToast: vi.fn() }));
vi.mock("@plane/services", () => ({
  WorkspaceAgentProviderService: class {
    list = mocks.list;
    setApiKey = vi.fn();
    removeCredential = vi.fn();
  },
  AgentConnectionService: class {
    account = mocks.account;
    disconnect = vi.fn();
  },
}));
vi.mock("@plane/blocks/toast", () => ({ setToast: mocks.setToast }));

// oxlint-disable-next-line import/first -- the module under test must load after the mocks
import { AgentProvidersRoot } from "./root";

const entry = (provider: TAgentProviderEntry["provider"], method: string | null): TAgentProviderEntry =>
  ({
    provider,
    personal: method ? { method, secret_hint: null, account_label: null, updated_at: "" } : null,
    workspace: null,
    instance_configured: false,
    can_manage_workspace: true,
  }) as TAgentProviderEntry;

describe("AgentProvidersRoot", () => {
  it("checks stored account sign-ins once, and refreshes when one is gone", async () => {
    mocks.list
      .mockResolvedValueOnce([entry("anthropic", null), entry("openai", "chatgpt"), entry("google", "api_key")])
      .mockResolvedValue([entry("anthropic", null), entry("openai", null), entry("google", "api_key")]);
    mocks.account.mockResolvedValue({ connected: false });

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AgentProvidersRoot workspaceSlug="acme" />
      </SWRConfig>
    );

    await waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(2));
    // Only the ChatGPT sign-in is an account; a Google API key needs no check.
    expect(mocks.account).toHaveBeenCalledTimes(1);
    expect(mocks.account).toHaveBeenCalledWith("openai", "acme", expect.any(AbortSignal));
    expect(mocks.setToast).toHaveBeenCalledWith(expect.objectContaining({ type: "warning" }));
  });
});

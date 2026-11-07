/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AGENT_ENV_MASK } from "@plane/constants";
import type { TInstanceAgent } from "@plane/types";
import { AgentFormDialog } from "./agent-form-dialog";

const service = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock("@plane/services", () => ({
  InstanceAgentService: class {
    create = service.create;
    update = service.update;
  },
}));
vi.mock("@plane/blocks/toast", () => ({ setToast: vi.fn() }));

const AGENT: TInstanceAgent = {
  id: "a1",
  name: "Claude",
  slug: "claude",
  description: "",
  adapter: "claude",
  env: { ANTHROPIC_API_KEY: AGENT_ENV_MASK },
  env_decryption_failed: false,
  default_permission_level: "ask_writes",
  max_permission_level: "ask_writes",
  attach_plane_mcp: true,
  is_enabled: true,
  sort_order: 1,
  created_at: "",
  updated_at: "",
};

beforeEach(() => {
  service.create.mockReset();
  service.update.mockReset();
});

describe("AgentFormDialog", () => {
  it("never shows a saved secret and only sends the value that changed", async () => {
    service.update.mockResolvedValue(AGENT);
    const onSaved = vi.fn();
    render(<AgentFormDialog isOpen agent={AGENT} onClose={vi.fn()} onSaved={onSaved} />);

    const key = (await screen.findByLabelText("Anthropic API key")) as HTMLInputElement;
    expect(key.value).toBe("");
    expect(key.type).toBe("password");
    expect(key.placeholder).toBe("Keep saved value");

    await userEvent.type(await screen.findByLabelText("Default model"), "claude-sonnet-5-5");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(service.update).toHaveBeenCalledWith("a1", {
      env: { ANTHROPIC_API_KEY: AGENT_ENV_MASK, PLANE_AGENT_MODEL: "claude-sonnet-5-5" },
    });
  });

  it("saves a new Claude agent without a credential, since members' and workspace keys come first", async () => {
    service.create.mockResolvedValue(AGENT);
    const onSaved = vi.fn();
    render(<AgentFormDialog isOpen onClose={vi.fn()} onSaved={onSaved} />);
    await userEvent.type(await screen.findByLabelText(/^Name/), "Claude");
    await userEvent.click(screen.getByRole("button", { name: "Add agent" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({ adapter: "claude", env: {} }));
  });

  it("creates an agent with the slug derived from the name", async () => {
    service.create.mockResolvedValue(AGENT);
    const onSaved = vi.fn();
    render(<AgentFormDialog isOpen onClose={vi.fn()} onSaved={onSaved} />);
    await userEvent.type(await screen.findByLabelText(/^Name/), "My Claude");
    await userEvent.type(screen.getByLabelText("Claude Code OAuth token"), "oauth-token");
    await userEvent.click(screen.getByRole("button", { name: "Add agent" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "My Claude", slug: "my-claude", env: { CLAUDE_CODE_OAUTH_TOKEN: "oauth-token" } })
    );
  });

  it("shows the API's field errors", async () => {
    service.update.mockRejectedValue({ slug: ["agent definition with this slug already exists."] });
    render(<AgentFormDialog isOpen agent={AGENT} onClose={vi.fn()} onSaved={vi.fn()} />);
    await userEvent.click(await screen.findByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("agent definition with this slug already exists.")).toBeTruthy();
  });
});

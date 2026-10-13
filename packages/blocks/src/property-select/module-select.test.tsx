/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModuleSelect } from "./module-select";
import type { ModuleOption } from "./module-select";

// The material-symbols font never loads in jsdom; emoji and lucide logos don't depend on it.
vi.mock("use-font-face-observer", () => ({ default: () => true }));

const ROCKET = "🚀";

const WITH_LOGO: ModuleOption = {
  id: "client-a",
  name: "Client A",
  logo_props: { in_use: "emoji", emoji: { value: "128640" } },
};
const WITHOUT_LOGO: ModuleOption = { id: "client-b", name: "Client B" };

const getValues = () => Promise.resolve({ results: [WITH_LOGO, WITHOUT_LOGO], next_page_results: false });

describe("ModuleSelect logos", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"], shouldAdvanceTime: true });
  });

  afterEach(async () => {
    cleanup();
    try {
      await act(() => vi.runOnlyPendingTimersAsync());
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows the selected module's logo in the breadcrumb trigger", () => {
    render(
      <ModuleSelect
        getValues={getValues}
        value={WITH_LOGO}
        onChange={vi.fn()}
        variant="breadcrumb"
        placeholder="Modules"
      />
    );

    const trigger = screen.getByRole("button", { name: /Client A/ });
    expect(within(trigger).getByText(ROCKET)).toBeDefined();
  });

  it("keeps the generic module glyph when the selected module has no logo", () => {
    render(
      <ModuleSelect
        getValues={getValues}
        value={WITHOUT_LOGO}
        onChange={vi.fn()}
        variant="breadcrumb"
        placeholder="Modules"
      />
    );

    const trigger = screen.getByRole("button", { name: /Client B/ });
    expect(within(trigger).queryByText(ROCKET)).toBeNull();
    expect(trigger.querySelector("svg")).not.toBeNull();
  });

  it("shows an image logo in the trigger", () => {
    const withImage: ModuleOption = {
      id: "client-c",
      name: "Client C",
      logo_props: { in_use: "image", image: { url: "https://cdn.example.com/client-c.png" } },
    };
    render(
      <ModuleSelect
        getValues={getValues}
        value={withImage}
        onChange={vi.fn()}
        variant="breadcrumb"
        placeholder="Modules"
      />
    );

    const trigger = screen.getByRole("button", { name: /Client C/ });
    expect(trigger.querySelector("img")?.getAttribute("src")).toBe("https://cdn.example.com/client-c.png");
  });

  it("shows each module's own logo next to its option", async () => {
    const user = userEvent.setup();
    render(
      <ModuleSelect getValues={getValues} value={null} onChange={vi.fn()} variant="pill-sm" placeholder="Modules" />
    );

    await user.click(screen.getByRole("button", { name: /Modules/ }));
    const popup = within(document.body);
    const withLogo = await popup.findByRole("option", { name: /Client A/ });
    const withoutLogo = popup.getByRole("option", { name: /Client B/ });

    expect(within(withLogo).getByText(ROCKET)).toBeDefined();
    expect(within(withoutLogo).queryByText(ROCKET)).toBeNull();
  });
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IFormattedInstanceConfiguration } from "@plane/types";
import { DefaultLanguageForm } from "./language-form";

const { updateInstanceConfigurations } = vi.hoisted(() => ({ updateInstanceConfigurations: vi.fn() }));

vi.mock("@/hooks/store", () => ({
  useInstance: () => ({ updateInstanceConfigurations }),
}));

const config = { DEFAULT_LANGUAGE: "en" } as IFormattedInstanceConfiguration;
const refreshedConfig = { ...config, DEFAULT_LANGUAGE: "fr" };
const languageField = () => screen.getByLabelText<HTMLButtonElement>("Default language");
const saveButton = () => screen.getByRole<HTMLButtonElement>("button", { name: "Save language" });

describe("default language configuration refresh", () => {
  beforeEach(() => {
    updateInstanceConfigurations.mockReset().mockResolvedValue(undefined);
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

  it("keeps an unsaved selection after a configuration refresh and saves that selection", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<DefaultLanguageForm config={config} />);

    await user.click(languageField());
    await user.click(await screen.findByRole("option", { name: "Español" }));
    expect(languageField().textContent).toBe("Español");
    expect(saveButton().disabled).toBe(false);

    rerender(<DefaultLanguageForm config={refreshedConfig} />);

    expect(languageField().textContent).toBe("Español");
    expect(saveButton().disabled).toBe(false);
    expect(updateInstanceConfigurations).not.toHaveBeenCalled();

    await user.click(saveButton());
    expect(updateInstanceConfigurations).toHaveBeenCalledExactlyOnceWith({ DEFAULT_LANGUAGE: "es" });
  });

  it("refreshes an untouched form without enabling save or writing configuration", () => {
    const { rerender } = render(<DefaultLanguageForm config={config} />);
    expect(languageField().textContent).toBe("English");

    rerender(<DefaultLanguageForm config={refreshedConfig} />);

    expect(languageField().textContent).toBe("Français");
    expect(saveButton().disabled).toBe(true);
    expect(updateInstanceConfigurations).not.toHaveBeenCalled();
  });

  it("replaces an unsaved selection with the effective value when the form becomes read-only", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<DefaultLanguageForm config={config} />);

    await user.click(languageField());
    await user.click(await screen.findByRole("option", { name: "Español" }));
    expect(languageField().textContent).toBe("Español");

    rerender(<DefaultLanguageForm config={config} readOnly />);

    expect(languageField().textContent).toBe("English");
    expect(languageField().disabled).toBe(true);
    expect(saveButton().disabled).toBe(true);
    expect(screen.getByText("Managed by the DEFAULT_LANGUAGE environment variable.")).toBeDefined();

    rerender(<DefaultLanguageForm config={refreshedConfig} readOnly />);

    expect(languageField().textContent).toBe("Français");
    await user.click(saveButton());
    expect(updateInstanceConfigurations).not.toHaveBeenCalled();
  });
});

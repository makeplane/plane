/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_OPTIONS } from "@plane/constants";
import { ThemeSwitch } from "@/components/core/theme/theme-switch";
import { TimezoneSelect } from "@/components/global/timezone-select";
import { ProfileSettingsLanguageAndTimezonePreferencesList } from "./language-and-timezone-list";

const mocks = vi.hoisted(() => ({
  updateCurrentUser: vi.fn(),
  updateUserProfile: vi.fn(),
  setToast: vi.fn(),
  timezoneDisabled: false,
}));

vi.mock("@plane/blocks/toast", () => ({ setToast: mocks.setToast }));
vi.mock("@plane/i18n", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@plane/i18n")>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/hooks/store/user", () => ({
  useUser: () => ({
    data: { user_timezone: "Asia/Kolkata" },
    updateCurrentUser: mocks.updateCurrentUser,
    userProfile: { data: { language: "en" } },
  }),
  useUserProfile: () => ({
    data: { start_of_the_week: 0 },
    updateUserProfile: mocks.updateUserProfile,
  }),
}));
vi.mock("@/hooks/use-timezone", () => ({
  default: () => ({
    disabled: mocks.timezoneDisabled,
    timezones: [
      {
        value: "Asia/Kolkata",
        query: "Asia/Kolkata Chennai, Kolkata, Mumbai, New Delhi, GMT+05:30, +05:30",
        content: <span>Chennai, Kolkata, Mumbai, New Delhi</span>,
      },
      {
        value: "America/New_York",
        query: "America/New_York Eastern Time (US & Canada), GMT-05:00, -05:00",
        content: <span>Eastern Time (US &amp; Canada)</span>,
      },
      { value: "UTC", query: "utc, coordinated universal time", content: "UTC" },
    ],
  }),
}));

describe("profile preference fields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateCurrentUser.mockResolvedValue({});
    mocks.updateUserProfile.mockResolvedValue({});
    mocks.timezoneDisabled = false;
  });

  it("names each control and preserves the current timezone, locale and first day", () => {
    render(<ProfileSettingsLanguageAndTimezonePreferencesList />);

    expect(screen.getByRole("combobox", { name: "timezone" }).textContent).toContain("+05:30 Chennai, Kolkata");
    expect(screen.getByRole("combobox", { name: "language" }).textContent).toContain("English");
    expect(screen.getByRole("combobox", { name: "First day of the week" }).textContent).toContain("Sunday");
    expect(mocks.updateCurrentUser).not.toHaveBeenCalled();
    expect(mocks.updateUserProfile).not.toHaveBeenCalled();
  });

  it("persists a numeric calendar day and restores keyboard focus after selection", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsLanguageAndTimezonePreferencesList />);
    const trigger = screen.getByRole("combobox", { name: "First day of the week" });

    trigger.focus();
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("option", { name: "Sunday" })));
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("option", { name: "Monday" })));
    await user.keyboard("{Enter}");

    await waitFor(() => expect(mocks.updateUserProfile).toHaveBeenCalledWith({ start_of_the_week: 1 }));
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("keeps the language endpoint payload and reports a rejected update", async () => {
    const user = userEvent.setup();
    mocks.updateUserProfile.mockRejectedValueOnce(new Error("Update failed"));
    render(<ProfileSettingsLanguageAndTimezonePreferencesList />);

    await user.click(screen.getByRole("combobox", { name: "language" }));
    await user.click(await screen.findByRole("option", { name: "Deutsch" }));

    await waitFor(() => expect(mocks.updateUserProfile).toHaveBeenCalledWith({ language: "de" }));
    await waitFor(() =>
      expect(mocks.setToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", message: "Failed to update language" })
      )
    );
    expect(mocks.updateCurrentUser).not.toHaveBeenCalled();
  });

  it("dismisses the language popup with Escape without changing a preference", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsLanguageAndTimezonePreferencesList />);
    const trigger = screen.getByRole("combobox", { name: "language" });

    await user.click(trigger);
    await screen.findByRole("option", { name: "Deutsch" });
    await user.keyboard("{Escape}");

    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(mocks.updateUserProfile).not.toHaveBeenCalled();
  });

  it("passes the original custom theme option to the existing appearance workflow", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const customTheme = THEME_OPTIONS.find((option) => option.value === "custom")!;
    render(<ThemeSwitch value={null} onChange={onChange} />);

    const trigger = screen.getByRole("combobox", { name: "theme" });
    expect(trigger.textContent).toContain("select_your_theme");
    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: customTheme.key }));

    expect(onChange).toHaveBeenCalledWith(customTheme);
  });

  it("leaves the theme unchanged when its popup is dismissed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ThemeSwitch value={THEME_OPTIONS[0]} onChange={onChange} />);

    await user.click(screen.getByRole("combobox", { name: "theme" }));
    await user.keyboard("{Escape}");

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("timezone field compatibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.timezoneDisabled = false;
    // The public field virtualizes its popup. jsdom has no layout, so give its viewport a
    // measurable box; actual responsive sizing and scrolling remain browser checks.
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(240);
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(320);
    vi.spyOn(Element.prototype, "clientHeight", "get").mockReturnValue(240);
    vi.spyOn(Element.prototype, "scrollHeight", "get").mockReturnValue(240);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(["America/New_York", "Eastern", "-05:00"])("finds a timezone by %s and emits its IANA ID", async (query) => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimezoneSelect value="Asia/Kolkata" onChange={onChange} label="Timezone" />);

    await user.click(screen.getByRole("combobox", { name: "Timezone" }));
    await user.type(await screen.findByRole("combobox", { name: "common.search.label" }), query);
    await user.click(await screen.findByRole("option", { name: "-05:00 Eastern Time (US & Canada)" }));

    expect(onChange).toHaveBeenCalledWith("America/New_York");
  });

  it("keeps UTC searchable by its descriptive name", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimezoneSelect value={undefined} onChange={onChange} label="Timezone" />);

    await user.click(screen.getByRole("combobox", { name: "Timezone" }));
    await user.type(await screen.findByRole("combobox", { name: "common.search.label" }), "coordinated");
    await user.click(await screen.findByRole("option", { name: "UTC" }));

    expect(onChange).toHaveBeenCalledWith("UTC");
  });

  it("keeps loading and permission-disabled fields inert", () => {
    const onChange = vi.fn();
    const { rerender } = render(<TimezoneSelect value="UTC" onChange={onChange} disabled />);

    expect(screen.getByRole("combobox", { name: "Select a timezone" }).hasAttribute("disabled")).toBe(true);
    mocks.timezoneDisabled = true;
    rerender(<TimezoneSelect value="UTC" onChange={onChange} />);
    expect(screen.getByRole("combobox", { name: "Select a timezone" }).hasAttribute("disabled")).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("preserves the boolean validation contract without marking false as invalid", () => {
    const { rerender } = render(<TimezoneSelect value="UTC" onChange={vi.fn()} error={false} />);
    expect(screen.getByRole("combobox", { name: "Select a timezone" }).getAttribute("aria-invalid")).not.toBe("true");

    rerender(<TimezoneSelect value="UTC" onChange={vi.fn()} error />);
    expect(screen.getByRole("combobox", { name: "Select a timezone" }).getAttribute("aria-invalid")).toBe("true");
  });
});

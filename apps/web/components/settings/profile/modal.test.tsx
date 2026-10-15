/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileSettingsModal } from "./modal";

const mocks = vi.hoisted(() => ({ toggle: vi.fn(), profileTabId: undefined as string | undefined }));
vi.mock("react-router", () => ({ useParams: () => ({ profileTabId: mocks.profileTabId }) }));
vi.mock("@/hooks/store/use-command-palette", () => ({
  useCommandPalette: () => ({
    profileSettingsModal: { isOpen: true, activeTab: "preferences" },
    toggleProfileSettingsModal: mocks.toggle,
  }),
}));
vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("./sidebar", () => ({ ProfileSettingsSidebarRoot: () => <div>Desktop sidebar</div> }));
vi.mock("./content", () => ({ ProfileSettingsContent: () => <div>Current settings page</div> }));
vi.mock("./sidebar/workspace-options", () => ({
  ProfileSettingsSidebarWorkspaceOptions: () => <a href="/alpha/settings/">Workspace settings</a>,
}));

describe("compact profile settings navigation", () => {
  beforeEach(() => {
    mocks.toggle.mockClear();
    mocks.profileTabId = undefined;
  });

  it("opens the existing sections and sends the same tab key to the modal store", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsModal />);
    const navigation = screen.getByRole("combobox", { name: "profile_settings" });
    await user.click(navigation);
    expect(screen.getAllByRole("option")).toHaveLength(5);
    await user.click(screen.getByRole("option", { name: "profile.actions.api-tokens" }));
    expect(mocks.toggle).toHaveBeenCalledWith({ activeTab: "api-tokens" });
  });

  it("preserves the existing workspace navigation when the profile route provides it", () => {
    mocks.profileTabId = "preferences";
    render(<ProfileSettingsModal />);
    expect(screen.getByRole("link", { name: "Workspace settings" }).getAttribute("href")).toBe("/alpha/settings/");
  });

  it("dismisses navigation without dismissing the settings dialog or changing its section", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsModal />);
    await user.click(screen.getByRole("combobox", { name: "profile_settings" }));
    await user.keyboard("{Escape}");
    expect(mocks.toggle).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "profile_settings" })).toBeTruthy();
  });
});

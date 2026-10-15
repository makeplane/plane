/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IUserProfileProjectSegregation } from "@plane/types";
import { ProfileSidebar } from "./sidebar";

const mocks = vi.hoisted(() => ({
  currentUserId: "profile-user",
  toggleProfileSettingsModal: vi.fn(),
  toggleProfileSidebar: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useParams: () => ({ userId: "profile-user" }) }));
vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@/hooks/store/user", () => ({ useUser: () => ({ data: { id: mocks.currentUserId } }) }));
vi.mock("@/hooks/store/use-app-theme", () => ({
  useAppTheme: () => ({ profileSidebarCollapsed: false, toggleProfileSidebar: mocks.toggleProfileSidebar }),
}));
vi.mock("@/hooks/store/use-command-palette", () => ({
  useCommandPalette: () => ({ toggleProfileSettingsModal: mocks.toggleProfileSettingsModal }),
}));
vi.mock("@/hooks/store/use-project", () => ({
  useProject: () => ({
    getProjectById: (id: string) =>
      id === "project-1"
        ? { name: "Community project", logo_props: { in_use: "emoji", emoji: { value: "128640" } } }
        : undefined,
  }),
}));
vi.mock("@/hooks/use-platform-os", () => ({ usePlatformOS: () => ({ isMobile: false }) }));
vi.mock("./time", () => ({ ProfileSidebarTime: () => <span>10:30 Asia/Kolkata</span> }));

const data: IUserProfileProjectSegregation = {
  user_data: {
    first_name: "Community",
    last_name: "User",
    display_name: "community-user",
    avatar_url: "",
    cover_image_url: "",
    date_joined: new Date("2026-01-01T00:00:00Z"),
    user_timezone: "Asia/Kolkata",
  },
  project_data: [{ id: "project-1", created_issues: 4, assigned_issues: 10, pending_issues: 2, completed_issues: 6 }],
};

describe("Profile sidebar presentation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentUserId = "profile-user";
  });

  it("keeps the self-profile edit action and its existing settings destination", async () => {
    const user = userEvent.setup();
    render(<ProfileSidebar userProjectsData={data} />);
    expect(screen.getByRole("img", { name: "Community User" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "common.edit" }));
    expect(mocks.toggleProfileSettingsModal).toHaveBeenCalledWith({ activeTab: "general", isOpen: true });
  });

  it("keeps another user's profile read-only and preserves project counts on keyboard expansion", async () => {
    mocks.currentUserId = "another-user";
    const user = userEvent.setup();
    render(<ProfileSidebar userProjectsData={data} />);
    expect(screen.queryByRole("button", { name: "common.edit" })).toBeNull();
    const project = screen.getByRole("button", { name: "Community project" });
    expect(project.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByText("60%")).toBeTruthy();
    project.focus();
    await user.keyboard("{Enter}");
    expect(project.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("4 issues")).toBeTruthy();
    expect(screen.getByText("10 issues")).toBeTruthy();
    expect(screen.getByText("2 issues")).toBeTruthy();
    expect(screen.getByText("6 issues")).toBeTruthy();
    expect(mocks.toggleProfileSettingsModal).not.toHaveBeenCalled();
  });

  it("does not render a project absent from CE's accessible project store", () => {
    render(
      <ProfileSidebar
        userProjectsData={{ ...data, project_data: [{ ...data.project_data[0], id: "missing-project" }] }}
      />
    );
    expect(screen.queryByRole("button", { name: "Community project" })).toBeNull();
  });
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { ProfileNavbar } from "./navbar";

vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

function ProfileRoute({ isAuthorized }: { isAuthorized: boolean }) {
  const location = useLocation();
  return (
    <>
      <ProfileNavbar isAuthorized={isAuthorized} />
      <output aria-label="Current route">{location.pathname}</output>
    </>
  );
}

function renderNavbar(isAuthorized: boolean, pathname = "/community/profile/profile-user/") {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <Routes>
        <Route path="/:workspaceSlug/profile/:userId/*" element={<ProfileRoute isAuthorized={isAuthorized} />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Your work route tabs", () => {
  it("retains all authorized tab destinations and the route's current-page state", () => {
    renderNavbar(true, "/community/profile/profile-user/created/");
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(5);
    expect(tabs.map((tab) => tab.getAttribute("href"))).toEqual([
      "/community/profile/profile-user/",
      "/community/profile/profile-user/assigned/",
      "/community/profile/profile-user/created/",
      "/community/profile/profile-user/subscribed/",
      "/community/profile/profile-user/activity/",
    ]);
    const current = screen.getByRole("tab", { name: "profile.tabs.created" });
    expect(current.getAttribute("aria-selected")).toBe("true");
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(current.tagName).toBe("A");
  });

  it("keeps restricted profile routes absent for an unauthorized viewer", () => {
    renderNavbar(false);
    expect(screen.getAllByRole("tab")).toHaveLength(1);
    expect(screen.getByRole("tab", { name: "profile.tabs.summary" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.queryByRole("tab", { name: "profile.tabs.activity" })).toBeNull();
  });

  it("moves focus with arrow keys and navigates only when a tab is activated", async () => {
    const user = userEvent.setup();
    renderNavbar(true);
    const summary = screen.getByRole("tab", { name: "profile.tabs.summary" });
    const assigned = screen.getByRole("tab", { name: "profile.tabs.assigned" });
    summary.focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(assigned);
    expect(screen.getByRole("status", { name: "Current route" }).textContent).toBe("/community/profile/profile-user/");
    expect(summary.getAttribute("aria-selected")).toBe("true");
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(screen.getByRole("status", { name: "Current route" }).textContent).toBe(
        "/community/profile/profile-user/assigned/"
      )
    );
    expect(assigned.getAttribute("aria-selected")).toBe("true");
  });
});

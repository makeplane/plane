/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import type { IUserProfileData, IUserStateDistribution } from "@plane/types";
import { ProfileStats } from "./stats";
import { ProfileWorkload } from "./workload";

vi.mock("next/navigation", () => ({ useParams: () => ({ workspaceSlug: "community", userId: "profile-user" }) }));
vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const profile: IUserProfileData = {
  created_issues: 0,
  assigned_issues: 12,
  subscribed_issues: 3,
  completed_issues: 5,
  pending_issues: 7,
  priority_distribution: [],
  state_distribution: [],
};

describe("Your work overview", () => {
  it("preserves every count and profile destination, including a zero count", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProfileStats userProfile={profile} />
      </MemoryRouter>
    );

    const created = screen.getByRole("link", { name: "profile.stats.created 0" });
    const assigned = screen.getByRole("link", { name: "profile.stats.assigned 12" });
    const subscribed = screen.getByRole("link", { name: "profile.stats.subscribed 3" });
    expect(created.getAttribute("href")).toBe("/community/profile/profile-user/created/");
    expect(assigned.getAttribute("href")).toBe("/community/profile/profile-user/assigned/");
    expect(subscribed.getAttribute("href")).toBe("/community/profile/profile-user/subscribed/");

    await user.tab();
    expect(document.activeElement).toBe(created);
    await user.tab();
    expect(document.activeElement).toBe(assigned);
    await user.tab();
    expect(document.activeElement).toBe(subscribed);
    expect(within(created).queryByRole("button")).toBeNull();
  });

  it("keeps loading placeholders separate from actionable count links", () => {
    render(
      <MemoryRouter>
        <ProfileStats userProfile={undefined} />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "profile.stats.overview" })).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("preserves workload group order and CE labels as noninteractive statistics", () => {
    const distribution: IUserStateDistribution[] = [
      { state_group: "backlog", state_count: 0 },
      { state_group: "unstarted", state_count: 4 },
      { state_group: "started", state_count: 7 },
      { state_group: "completed", state_count: 9 },
      { state_group: "cancelled", state_count: 2 },
    ];
    const { container } = render(<ProfileWorkload stateDistribution={distribution} />);
    expect(screen.getByText("Not started")).toBeTruthy();
    expect(screen.getByText("Working on")).toBeTruthy();
    expect(screen.getByText("Canceled")).toBeTruthy();
    expect(Array.from(container.querySelectorAll("p")).map((element) => element.textContent)).toEqual([
      "0",
      "4",
      "7",
      "9",
      "2",
    ]);
    expect(container.querySelector("a")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

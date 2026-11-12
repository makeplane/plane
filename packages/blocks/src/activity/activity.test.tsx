/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityCommentCard, ActivityCommentHeader } from "./comment-card";
import { ActivityTimelineItem, ActivityTimelineTimestamp } from "./timeline";

describe("ActivityTimelineItem", () => {
  it("renders actor, message and time on one line with the rail", () => {
    const { container } = render(
      <ActivityTimelineItem
        id="activity-1"
        icon={<svg data-testid="glyph" />}
        actor="Amanda"
        timestamp={<ActivityTimelineTimestamp tooltip="Oct 28, 2026">2 hours ago</ActivityTimelineTimestamp>}
      >
        set the state to <strong>Done</strong>.
      </ActivityTimelineItem>
    );

    const item = container.querySelector("#activity-1");
    expect(item?.textContent).toContain("Amanda set the state to Done.");
    expect(item?.textContent).toContain("2 hours ago");
    expect(item?.className).toContain("pb-6");
    expect(item?.querySelector("[aria-hidden]")).toBeTruthy();
    expect(screen.getByTestId("glyph")).toBeTruthy();
  });

  it("drops the rail and spacing for the last entry", () => {
    const { container } = render(
      <ActivityTimelineItem id="activity-2" icon={<svg />} showConnector={false}>
        created the work item
      </ActivityTimelineItem>
    );

    const item = container.querySelector("#activity-2");
    expect(item?.className).not.toContain("pb-6");
    expect(item?.querySelector(".left-\\[13px\\]")).toBeNull();
  });
});

describe("ActivityCommentCard", () => {
  it("lays out avatar, header, body and footer", () => {
    render(
      <ActivityCommentCard
        id="comment-card"
        avatar={<span data-testid="avatar" />}
        header={
          <ActivityCommentHeader
            author="Ethan"
            action="commented"
            timestamp={<ActivityTimelineTimestamp>1 day ago</ActivityTimelineTimestamp>}
            actions={<button type="button">Options</button>}
          />
        }
        footer={<span>reactions</span>}
      >
        <p>Looks good</p>
      </ActivityCommentCard>
    );

    expect(screen.getByTestId("avatar")).toBeTruthy();
    expect(screen.getByText("Ethan")).toBeTruthy();
    expect(screen.getByText("commented")).toBeTruthy();
    expect(screen.getByText("1 day ago")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Options" })).toBeTruthy();
    expect(screen.getByText("Looks good")).toBeTruthy();
    expect(screen.getByText("reactions")).toBeTruthy();
  });

  it("marks a highlighted comment with an accent border", () => {
    const { container } = render(
      <ActivityCommentCard id="highlighted" avatar={null} header={null} highlighted>
        body
      </ActivityCommentCard>
    );
    expect(container.querySelectorAll(".border-accent-strong").length).toBeGreaterThan(0);
  });
});

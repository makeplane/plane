/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IIssueActivity, IUserActivityResponse } from "@plane/types";
import { ProfileActivity } from "../overview/activity";
import { ActivityList } from "./activity-list";

const mocks = vi.hoisted(() => ({
  activityData: undefined as IUserActivityResponse | undefined,
  editor: vi.fn(),
  activityMessage: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useParams: () => ({ workspaceSlug: "community", userId: "profile-user" }) }));
vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@/hooks/store/user", () => ({ useUser: () => ({ data: { id: "profile-user" } }) }));
vi.mock("@/hooks/store/use-workspace", () => ({
  useWorkspace: () => ({ getWorkspaceBySlug: () => ({ id: "workspace-1" }) }),
}));
vi.mock("swr", () => ({ default: () => ({ data: mocks.activityData }) }));
vi.mock("@/services/user.service", () => ({
  UserService: class {
    getUserProfileActivity = vi.fn();
  },
}));
vi.mock("@/components/core/activity", () => ({
  ActivityIcon: () => <svg aria-hidden="true" />,
  ActivityMessage: (props: { activity: IIssueActivity }) => {
    mocks.activityMessage(props);
    return <span>changed {props.activity.field}</span>;
  },
  IssueLink: () => <span>COMM-1 Community work item</span>,
}));
vi.mock("@/components/editor/rich-text", () => ({
  RichTextEditor: (props: { initialValue: string }) => {
    mocks.editor(props);
    return <div>{props.initialValue}</div>;
  },
}));

function activity(overrides: Partial<IIssueActivity> = {}): IIssueActivity {
  return {
    actor: "profile-user",
    actor_detail: {
      id: "profile-user",
      first_name: "Community",
      last_name: "User",
      display_name: "community-user",
      avatar_url: "",
      is_bot: false,
    },
    attachments: [],
    created_at: new Date(),
    updated_at: new Date(),
    created_by: "profile-user",
    updated_by: "profile-user",
    field: null,
    id: "activity-1",
    issue: "issue-1",
    issue_detail: {
      id: "issue-1",
      name: "Community work item",
      description_html: "",
      priority: "none",
      sequence_id: "1",
      type_id: "type-1",
    },
    new_identifier: null,
    new_value: null,
    old_identifier: null,
    old_value: null,
    project: "project-1",
    project_detail: { id: "project-1", name: "Community project", identifier: "COMM", logo_props: { in_use: "emoji" } },
    verb: "created",
    workspace: "workspace-1",
    workspace_detail: { id: "workspace-1", name: "Community", slug: "community" },
    ...overrides,
  };
}

function response(results: IIssueActivity[]): IUserActivityResponse {
  return {
    count: results.length,
    extra_stats: null,
    next_cursor: "",
    next_page_results: false,
    prev_cursor: "",
    prev_page_results: false,
    results,
    total_pages: 1,
    total_results: results.length,
  };
}

describe("Your work activity presentation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.activityData = undefined;
  });

  it("keeps the recent actor, message and time together without changing activity data", () => {
    const item = activity({ field: "labels", new_value: "Design" });
    mocks.activityData = response([item]);
    render(<ProfileActivity />);
    expect(screen.getByRole("img", { name: "community-user" })).toBeTruthy();
    const message = screen.getByText("You").closest("p");
    expect(message?.textContent).toContain("changed labels");
    expect(message?.children.length).toBeGreaterThan(1);
    expect(mocks.activityMessage).toHaveBeenCalledWith(expect.objectContaining({ activity: item, showIssue: true }));
  });

  it("keeps comment rows semantic and the embedded editor read-only", () => {
    const comment = activity({ field: "comment", new_value: "Community comment" });
    render(
      <MemoryRouter>
        <ActivityList activity={response([comment])} />
      </MemoryRouter>
    );
    const list = screen.getByRole("list");
    expect(list.children[0].tagName).toBe("LI");
    expect(screen.getByText("Community comment")).toBeTruthy();
    expect(mocks.editor).toHaveBeenCalledWith(
      expect.objectContaining({
        editable: false,
        id: comment.id,
        initialValue: "Community comment",
        workspaceId: "workspace-1",
        workspaceSlug: "community",
        projectId: "project-1",
      })
    );
  });

  it("preserves actor profile routes and public Avatar names in creation rows", () => {
    render(
      <MemoryRouter>
        <ActivityList activity={response([activity()])} />
      </MemoryRouter>
    );
    expect(screen.getByRole("img", { name: "community-user" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "You" }).getAttribute("href")).toBe("/community/profile/profile-user/");
    expect(screen.getByText("COMM-1 Community work item")).toBeTruthy();
  });

  it("keeps updated_by events excluded", () => {
    const { container } = render(
      <MemoryRouter>
        <ActivityList activity={response([activity({ field: "updated_by" })])} />
      </MemoryRouter>
    );
    expect(container.querySelectorAll("li")).toHaveLength(0);
    expect(mocks.activityMessage).not.toHaveBeenCalled();
  });
});

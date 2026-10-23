/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { observable, runInAction } from "mobx";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IssueActivityBlockComponent } from "./activity-block";

const user = observable({ user_timezone: "UTC" });
vi.mock("@/hooks/store/user", () => ({ useUser: () => ({ data: user }) }));
vi.mock("@/hooks/store/use-issue-detail", () => ({
  useIssueDetail: () => ({
    activity: {
      getActivityById: () => ({
        created_at: "2026-10-23T15:18:47.523136+00:00",
        verb: "created",
      }),
    },
  }),
}));
vi.mock("@/hooks/use-platform-os", () => ({
  usePlatformOS: () => ({ isMobile: false }),
}));
vi.mock("@makeplane/propel/components/tooltip", () => ({
  Tooltip: ({ label, children }: { label: string; children: ReactNode }) => <span title={label}>{children}</span>,
}));
vi.mock("../", () => ({ IssueUser: () => null }));
vi.mock("./issue-creator", () => ({ IssueCreatorDisplay: () => null }));

afterEach(cleanup);

describe("activity timestamp timezone", () => {
  it("uses the saved profile timezone and reacts to changes without a reload", () => {
    render(
      <IssueActivityBlockComponent activityId="creation" ends={undefined}>
        created the work item
      </IssueActivityBlockComponent>
    );
    expect(screen.getByTitle("Oct 23, 2026, 15:18")).toBeDefined();

    act(() =>
      runInAction(() => {
        user.user_timezone = "Asia/Kolkata";
      })
    );
    expect(screen.getByTitle("Oct 23, 2026, 20:48")).toBeDefined();

    cleanup();
    act(() =>
      runInAction(() => {
        user.user_timezone = "UTC";
      })
    );
    render(
      <IssueActivityBlockComponent activityId="creation" ends={undefined}>
        created the work item
      </IssueActivityBlockComponent>
    );
    expect(screen.getByTitle("Oct 23, 2026, 15:18")).toBeDefined();
  });
});

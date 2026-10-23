/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ComponentProps, ReactNode } from "react";
import { createRef } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { observable, runInAction } from "mobx";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActivityBlockComponent } from "./common/activity/activity-block";
import { CommentCardDisplay } from "./comments/card/display";
import { PageNavigationPaneInfoTabVersionHistory } from "./pages/navigation-pane/tab-panels/info/version-history";
import { PageVersionsMainContent } from "./pages/version/main-content";
import { NotificationItem } from "./workspace-notifications/sidebar/notification-card/item";
import { ApiTokenListItem } from "./api-token/token-list-item";
import { GeneratedTokenDetails } from "./api-token/modal/generated-token-details";

const timestamp = "2026-10-23T23:30:00Z";
const user = observable({ user_timezone: "UTC" });
const version = { id: "version", owned_by: "actor", last_saved_at: timestamp };
const token = {
  id: "token",
  label: "Test token",
  description: "",
  is_active: true,
  expired_at: timestamp,
} as ComponentProps<typeof ApiTokenListItem>["token"];

vi.mock("@/hooks/store/user", () => ({ useUser: () => ({ data: user }) }));
vi.mock("@/hooks/use-platform-os", () => ({
  usePlatformOS: () => ({ isMobile: false }),
}));
vi.mock("@/hooks/store/use-member", () => ({
  useMember: () => ({ getUserDetails: () => undefined }),
}));
vi.mock("@makeplane/propel/components/tooltip", () => ({
  Tooltip: ({ label, children }: { label: string; children: ReactNode }) => <span title={label}>{children}</span>,
}));
vi.mock("@makeplane/propel/components/dialog", () => {
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- Vitest hoists this factory.
  const Container = ({ children }: { children: ReactNode }) => <div>{children}</div>;
  return Object.fromEntries(
    [
      "DialogActions",
      "DialogBody",
      "DialogDescription",
      "DialogHeader",
      "DialogHeading",
      "DialogInfo",
      "DialogMain",
      "DialogTitle",
    ].map((key) => [key, Container])
  );
});
vi.mock("@plane/i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@plane/hooks", () => ({
  useHashScroll: () => ({ isHashMatch: false }),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", () => ({
  default: ({ children }: { children: ReactNode }) => <a href="/">{children}</a>,
}));
vi.mock("@makeplane/propel/components/text-area-field", () => ({
  TextAreaField: () => <textarea aria-label="Description" />,
}));
vi.mock("swr", () => ({
  default: (key: string) => ({
    data: key.startsWith("PAGE_VERSIONS_LIST_") ? [version] : version,
  }),
}));
vi.mock("@/hooks/use-query-params", () => ({
  useQueryParams: () => ({ updateQueryParams: () => "/" }),
}));
vi.mock("@/components/pages/navigation-pane", () => ({
  PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM: "version",
}));
vi.mock("@/components/common/activity/user", () => ({ User: () => null }));
vi.mock("@/components/editor/lite-text", () => ({
  LiteTextEditor: () => null,
}));
vi.mock("@/components/comments/comment-reaction", () => ({
  CommentReactions: () => null,
}));
vi.mock("@/components/comments/card/edit-form", () => ({
  CommentCardEditForm: () => null,
}));
vi.mock("@/components/api-token/delete-token-modal", () => ({
  DeleteApiTokenModal: () => null,
}));
vi.mock("@/hooks/store/notifications", () => ({
  useWorkspaceNotifications: () => ({}),
}));
vi.mock("@/hooks/store/notifications/use-notification", () => ({
  useNotification: () => ({
    asJson: {
      id: "notification",
      project: "project",
      data: { issue_activity: { field: "name" } },
      snoozed_till: timestamp,
    },
  }),
}));
vi.mock("@/hooks/store/use-issue-detail", () => ({
  useIssueDetail: () => ({}),
}));
vi.mock("@/hooks/store/use-workspace", () => ({
  useWorkspace: () => ({ getWorkspaceBySlug: () => ({ id: "workspace" }) }),
}));
vi.mock("@/components/workspace-notifications/sidebar/notification-card/content", () => ({
  NotificationContent: () => null,
}));
vi.mock("@/components/workspace-notifications/sidebar/notification-card/options", () => ({
  NotificationOption: () => null,
}));

beforeEach(() =>
  runInAction(() => {
    user.user_timezone = "UTC";
  })
);
afterEach(cleanup);

describe("profile timezone at timestamp display boundaries", () => {
  const displays: [string, () => ReactNode, string, string][] = [
    [
      "workspace activity",
      () => (
        <ActivityBlockComponent
          activity={{ created_at: timestamp } as ComponentProps<typeof ActivityBlockComponent>["activity"]}
          ends={undefined}
        >
          created
        </ActivityBlockComponent>
      ),
      "Oct 23, 2026, 23:30",
      "Oct 24, 2026, 05:00",
    ],
    [
      "comment tooltip",
      () => (
        <CommentCardDisplay
          comment={{ id: "comment", created_at: timestamp } as ComponentProps<typeof CommentCardDisplay>["comment"]}
          activityOperations={
            {
              userReactions: () => undefined,
              reactionIds: () => undefined,
            } as unknown as ComponentProps<typeof CommentCardDisplay>["activityOperations"]
          }
          disabled
          showAccessSpecifier={false}
          entityId="issue"
          readOnlyEditorRef={createRef()}
          workspaceId="workspace"
          workspaceSlug="demo"
        />
      ),
      "Oct 23, 2026 at 23:30",
      "Oct 24, 2026 at 05:00",
    ],
    [
      "page version list",
      () => (
        <PageNavigationPaneInfoTabVersionHistory
          page={{ id: "page" } as ComponentProps<typeof PageNavigationPaneInfoTabVersionHistory>["page"]}
          versionHistory={{
            fetchAllVersions: vi.fn(),
            fetchVersionDetails: vi.fn(),
          }}
        />
      ),
      "Oct 23, 2026, 23:30",
      "Oct 24, 2026, 05:00",
    ],
    [
      "page version details",
      () => (
        <PageVersionsMainContent
          activeVersion="version"
          editorComponent={() => null}
          fetchVersionDetails={vi.fn()}
          handleClose={vi.fn()}
          handleRestore={vi.fn()}
          pageId="page"
          restoreEnabled={false}
          storeType={"project" as ComponentProps<typeof PageVersionsMainContent>["storeType"]}
        />
      ),
      "Oct 23, 2026 23:30",
      "Oct 24, 2026 05:00",
    ],
    [
      "notification snooze",
      () => <NotificationItem workspaceSlug="demo" notificationId="notification" />,
      "Till Oct 23, 2026, 11:30 PM",
      "Till Oct 24, 2026, 05:00 AM",
    ],
    [
      "API token list",
      () => <ApiTokenListItem token={token} />,
      "Expires Oct 23, 2026 at 23:30",
      "Expires Oct 24, 2026 at 05:00",
    ],
    [
      "generated API token",
      () => <GeneratedTokenDetails tokenDetails={token} handleClose={vi.fn()} />,
      "Expires Oct 23, 2026 at 23:30",
      "Expires Oct 24, 2026 at 05:00",
    ],
  ];

  it.each(displays)("updates %s when the saved preference changes", (_name, display, utc, india) => {
    const { container } = render(display());
    const text = () =>
      `${container.textContent} ${Array.from(container.querySelectorAll("[title]"))
        .map((node) => node.getAttribute("title"))
        .join(" ")}`.replace(/\s+/g, " ");
    expect(text()).toContain(utc);
    act(() =>
      runInAction(() => {
        user.user_timezone = "Asia/Kolkata";
      })
    );
    expect(text()).toContain(india);
    act(() =>
      runInAction(() => {
        user.user_timezone = "UTC";
      })
    );
    expect(text()).toContain(utc);
  });
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EIssueServiceType } from "@plane/types";
import type { TSubIssueOperations } from "@plane/types";
import { SubIssuesListItem } from "./list-item";

const fixture = vi.hoisted(() => ({
  issue: {
    id: "child-1",
    name: "Child work item",
    project_id: "project-1",
    sequence_id: 2,
    sub_issues_count: 0,
  },
  getProjectById: vi.fn(() => ({ id: "project-1", identifier: "ABC" })),
  fetchSubIssues: vi.fn(),
  handleRedirection: vi.fn(),
  removeSubIssue: vi.fn(),
  handleIssueCrudState: vi.fn(),
  toggleDeleteIssueModal: vi.fn(),
  setSubIssueHelpers: vi.fn(),
}));

const localesDirectory = path.resolve(process.cwd(), "../../packages/i18n/src/locales");
const english = JSON.parse(readFileSync(path.join(localesDirectory, "en", "work-item.json"), "utf8")) as Record<
  string,
  unknown
>;

function translate(key: string): string {
  const value = key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object") return (current as Record<string, unknown>)[part];
    return undefined;
  }, english);
  return typeof value === "string" ? value : key;
}

vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ t: (key: string) => translate(key) }) }));
vi.mock("@plane/blocks/layout", () => ({
  ControlLink: ({ children, ...props }: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>) => (
    <a {...props}>{children}</a>
  ),
}));
vi.mock("@plane/utils", () => ({
  cn: (...values: unknown[]) => values.filter(Boolean).join(" "),
  generateWorkItemLink: () => "/work-item",
}));
vi.mock("@/components/issues/issue-detail-widgets/sub-issues/helper", () => ({
  useSubIssueOperations: () => ({ fetchSubIssues: fixture.fetchSubIssues }),
}));
vi.mock("@/components/issues/issue-layouts/properties/with-display-properties-HOC", () => ({
  WithDisplayPropertiesHOC: ({ children }: React.PropsWithChildren) => children,
}));
vi.mock("@/hooks/store/use-issue-detail", () => ({
  useIssueDetail: () => ({
    issue: { getIssueById: () => fixture.issue },
    subIssues: {
      filters: { getSubIssueFilters: () => undefined },
      subIssueHelpersByIssueId: () => ({ preview_loader: [], issue_visibility: [] }),
      setSubIssueHelpers: fixture.setSubIssueHelpers,
    },
    toggleCreateIssueModal: vi.fn(),
    toggleDeleteIssueModal: fixture.toggleDeleteIssueModal,
  }),
}));
vi.mock("@/hooks/store/use-project", () => ({ useProject: () => ({ getProjectById: fixture.getProjectById }) }));
vi.mock("@/hooks/use-issue-peek-overview-redirection", () => ({
  default: () => ({ handleRedirection: fixture.handleRedirection }),
}));
vi.mock("@/hooks/use-platform-os", () => ({ usePlatformOS: () => ({ isMobile: true }) }));
vi.mock("@/components/issues/issue-detail/issue-identifier", () => ({ IssueIdentifier: () => null }));
vi.mock("./properties", () => ({ SubIssuesListItemProperties: () => null }));
vi.mock("./root", () => ({ SubIssuesListRoot: () => null }));
vi.mock("@makeplane/propel/components/tooltip", () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => children,
}));

function renderItem(canEdit = true, issueServiceType = EIssueServiceType.ISSUES) {
  const subIssueOperations = {
    copyLink: vi.fn(),
    removeSubIssue: fixture.removeSubIssue,
    updateSubIssue: vi.fn(),
  } as unknown as TSubIssueOperations;

  render(
    <SubIssuesListItem
      workspaceSlug="workspace"
      projectId="project-1"
      parentIssueId="parent-1"
      rootIssueId="parent-1"
      issueId="child-1"
      spacingLeft={10}
      canEdit={canEdit}
      handleIssueCrudState={fixture.handleIssueCrudState}
      subIssueOperations={subIssueOperations}
      issueServiceType={issueServiceType}
    />
  );
}

async function openActions() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "aria_labels.common.more_actions" }));
  return { user, menu: within(document.body).getByRole("menu") };
}

describe("SubIssuesListItem actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fixture.issue.sub_issues_count = 0;
  });

  it("uses the dedicated unlink label and only removes the parent relation", async () => {
    renderItem();
    const { user, menu } = await openActions();

    const unlink = within(menu).getByRole("menuitem", { name: "Unlink sub-work item" });
    await user.click(unlink);

    expect(fixture.removeSubIssue).toHaveBeenCalledWith("workspace", "project-1", "parent-1", "child-1");
    expect(fixture.handleIssueCrudState).not.toHaveBeenCalledWith("delete", expect.anything(), expect.anything());
    expect(fixture.toggleDeleteIssueModal).not.toHaveBeenCalled();
  });

  it("hides the unlink action when the user cannot edit", async () => {
    renderItem(false);
    const { menu } = await openActions();

    expect(within(menu).queryByRole("menuitem", { name: "Unlink sub-work item" })).toBeNull();
  });

  it("keeps the existing label and unlink behavior for other issue service types", async () => {
    renderItem(true, EIssueServiceType.EPICS);
    const { user, menu } = await openActions();

    const unlink = within(menu).getByRole("menuitem", { name: "Remove work item" });
    await user.click(unlink);

    expect(fixture.removeSubIssue).toHaveBeenCalledWith("workspace", "project-1", "parent-1", "child-1");
    expect(fixture.handleIssueCrudState).not.toHaveBeenCalledWith("delete", expect.anything(), expect.anything());
    expect(fixture.toggleDeleteIssueModal).not.toHaveBeenCalled();
  });

  it.each(["{Enter}", " "])("expands nested sub-work items with %s without opening the row", async (key) => {
    fixture.issue.sub_issues_count = 1;
    renderItem();
    const user = userEvent.setup();
    const expand = screen.getByRole("button", { name: translate("issue.display.extra.show_sub_issues") });

    expand.focus();
    await user.keyboard(key);

    expect(fixture.fetchSubIssues).toHaveBeenCalledWith("workspace", "project-1", "child-1");
    expect(fixture.setSubIssueHelpers).toHaveBeenCalledWith("parent-1", "issue_visibility", "child-1");
    expect(fixture.handleRedirection).not.toHaveBeenCalled();
  });

  it("provides the dedicated key in every work-item locale", () => {
    const locales = readdirSync(localesDirectory, { withFileTypes: true }).filter((entry) => entry.isDirectory());

    for (const locale of locales) {
      const messages = JSON.parse(readFileSync(path.join(localesDirectory, locale.name, "work-item.json"), "utf8")) as {
        issue?: { remove?: { sub_issue?: { label?: string } } };
      };
      expect(messages.issue?.remove?.sub_issue?.label, locale.name).toBeTruthy();
    }
  });
});

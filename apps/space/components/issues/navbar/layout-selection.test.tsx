/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IssuesLayoutSelection } from "./layout-selection";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  updateIssueFilters: vi.fn(),
  layoutOptions: { list: true, kanban: true },
  activeLayout: "list",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () => new URLSearchParams("peekId=item-1&priority=high,low&state=started&labels=label-1,label-2"),
}));
vi.mock("@/hooks/store/use-issue-filter", () => ({
  useIssueFilter: () => ({
    layoutOptions: mocks.layoutOptions,
    getIssueFilters: () => ({ display_filters: { layout: mocks.activeLayout } }),
    updateIssueFilters: mocks.updateIssueFilters,
  }),
}));
vi.mock("@plane/i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("Space layout selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.activeLayout = "list";
    mocks.layoutOptions.list = true;
    mocks.layoutOptions.kanban = true;
  });

  it("announces the selected layout and preserves public board filters on keyboard activation", async () => {
    const user = userEvent.setup();
    render(<IssuesLayoutSelection anchor="public-board" />);
    const [list, board] = screen.getAllByRole("button");
    expect(list.getAttribute("aria-pressed")).toBe("true");
    expect(board.getAttribute("aria-pressed")).toBe("false");
    expect(list.getAttribute("aria-label")).toBeTruthy();
    expect(board.getAttribute("aria-label")).toBeTruthy();

    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(board);
    await user.keyboard("{Enter}");

    expect(mocks.updateIssueFilters).toHaveBeenCalledWith("public-board", "display_filters", "layout", "kanban");
    const destination = new URL(mocks.push.mock.calls[0][0], "https://space.test");
    expect(destination.pathname).toBe("/issues/public-board");
    expect(Object.fromEntries(destination.searchParams)).toEqual({
      board: "kanban",
      peekId: "item-1",
      priority: "high,low",
      state: "started",
      labels: "label-1,label-2",
    });
  });

  it("does not navigate or rewrite filters when the current layout is chosen", async () => {
    const user = userEvent.setup();
    render(<IssuesLayoutSelection anchor="public-board" />);
    await user.click(screen.getAllByRole("button")[0]);
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.updateIssueFilters).not.toHaveBeenCalled();
  });

  it("does not offer a switcher when the only published layout is already active", () => {
    mocks.layoutOptions.kanban = false;
    render(<IssuesLayoutSelection anchor="public-board" />);
    expect(screen.queryByRole("group")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
  it("keeps the remaining published layout reachable when a stale saved layout is no longer available", async () => {
    mocks.activeLayout = "kanban";
    mocks.layoutOptions.kanban = false;
    const user = userEvent.setup();
    render(<IssuesLayoutSelection anchor="public-board" />);
    const remainingLayout = screen.getByRole("button");
    expect(remainingLayout.getAttribute("aria-pressed")).toBe("false");
    await user.click(remainingLayout);
    expect(mocks.updateIssueFilters).toHaveBeenCalledWith("public-board", "display_filters", "layout", "list");
    expect(new URL(mocks.push.mock.calls[0][0], "https://space.test").searchParams.get("board")).toBe("list");
  });
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PropertiesOverflowRow } from "./properties-overflow-row";
import type { WorkItemPropertyEntry } from "./types";
import { UNMEASURED_CHIP_WIDTH_PX } from "./use-properties-overflow";

const entry = (
  key: string,
  hidePriority: number,
  extra: Partial<WorkItemPropertyEntry> = {}
): WorkItemPropertyEntry => ({
  key,
  hidePriority,
  chip: <span>{`${key} chip`}</span>,
  menuRow: { icon: null, label: `${key} label`, preview: `${key} value` },
  ...extra,
});

const renderRow = (entries: WorkItemPropertyEntry[], availableWidth: number | null) =>
  render(
    <PropertiesOverflowRow
      entries={entries}
      availableWidth={availableWidth}
      menuLabel="Properties"
      getTriggerAriaLabel={(count) => `${count} more properties`}
    />
  );

// No chip is measured in jsdom, so each one is budgeted at the unmeasured estimate. One chip plus a
// gap and the "+N" trigger fits this; two chips do not.
const ONE_CHIP_BUDGET = UNMEASURED_CHIP_WIDTH_PX + 60;

describe("PropertiesOverflowRow", () => {
  it("renders every chip and no trigger without a budget", () => {
    renderRow([entry("state", 0), entry("priority", 1), entry("link", 12)], null);
    expect(screen.getByText("state chip")).toBeTruthy();
    expect(screen.getByText("priority chip")).toBeTruthy();
    expect(screen.getByText("link chip")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /more properties/ })).toBeNull();
  });

  it("collapses the least important chips into a +N trigger", () => {
    renderRow([entry("link", 12), entry("state", 0), entry("priority", 1)], ONE_CHIP_BUDGET);
    expect(screen.getByText("state chip")).toBeTruthy();
    expect(screen.queryByText("priority chip")).toBeNull();
    expect(screen.queryByText("link chip")).toBeNull();
    const trigger = screen.getByRole("button", { name: "2 more properties" });
    expect(trigger.textContent).toBe("+2");
  });

  it("lists the collapsed properties under a Properties heading, in row order", async () => {
    const user = userEvent.setup();
    renderRow([entry("link", 12), entry("state", 0), entry("priority", 1)], ONE_CHIP_BUDGET);
    await user.click(screen.getByRole("button", { name: "2 more properties" }));
    const menu = await screen.findByRole("menu");
    expect(within(menu).getByText("Properties")).toBeTruthy();
    const rows = within(menu).getAllByRole("menuitem");
    expect(rows.map((row) => row.textContent)).toEqual(["link labellink value", "priority labelpriority value"]);
  });

  it("runs an action row and closes the menu", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderRow(
      [entry("state", 0), entry("link", 12, { menuRow: { icon: null, label: "Links", preview: "2", onSelect } })],
      UNMEASURED_CHIP_WIDTH_PX
    );
    await user.click(screen.getByRole("button", { name: "2 more properties" }));
    await user.click(await screen.findByRole("menuitem", { name: /Links/ }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("disables read-only rows but keeps their value", async () => {
    const user = userEvent.setup();
    renderRow(
      [
        entry("state", 0),
        entry("cycle", 7, { menuRow: { icon: null, label: "Cycle", preview: "Sprint 4", disabled: true } }),
      ],
      ONE_CHIP_BUDGET
    );
    await user.click(screen.getByRole("button", { name: "1 more properties" }));
    const row = await screen.findByRole("menuitem", { name: /Cycle/ });
    expect(row.getAttribute("aria-disabled")).toBe("true");
    expect(row.textContent).toContain("Sprint 4");
  });

  it("opens an editable row's editor from the row and keeps the menu open", async () => {
    const user = userEvent.setup();
    const onEditorOpen = vi.fn();
    renderRow(
      [
        entry("state", 0),
        entry("priority", 1, {
          menuRow: {
            icon: null,
            label: "Priority",
            editor: () => (
              <button type="button" onClick={onEditorOpen}>
                edit priority
              </button>
            ),
          },
        }),
      ],
      ONE_CHIP_BUDGET
    );
    await user.click(screen.getByRole("button", { name: "1 more properties" }));
    const row = await screen.findByRole("menuitem", { name: /Priority/ });
    // A pointer press lands on the editor's trigger stretched over the row.
    await user.click(within(row).getByRole("button", { name: "edit priority" }));
    expect(onEditorOpen).toHaveBeenCalledOnce();
    expect(screen.getByRole("menu")).toBeTruthy();
    // Activating the row itself (what Enter does) is handed on to the editor's trigger.
    fireEvent.click(row);
    expect(onEditorOpen).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("renders the richest variant that fits", () => {
    const labels = entry("labels", 3, {
      variants: [
        { id: "pills", widthPx: 400, chip: <span>three pills</span> },
        { id: "summary", widthPx: 60, chip: <span>3 labels</span> },
      ],
    });
    const { unmount } = renderRow([labels], 500);
    expect(screen.getByText("three pills")).toBeTruthy();
    unmount();
    renderRow([labels], 100);
    expect(screen.getByText("3 labels")).toBeTruthy();
    expect(screen.queryByText("three pills")).toBeNull();
  });
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DueDateOutline } from "@makeplane/propel/icons";
import { describe, expect, it } from "vitest";
import { ReadOnlyProperty } from "./read-only-property";

describe("Published property presentation", () => {
  it.each([true, false])("keeps properties out of the editing tab order with border=%s", async (shouldShowBorder) => {
    const user = userEvent.setup();
    render(
      <>
        <ReadOnlyProperty
          icon={DueDateOutline}
          label="Oct 15, 2026"
          tooltip="Due date: Oct 15, 2026"
          shouldShowBorder={shouldShowBorder}
        />
        <button type="button">Next control</button>
      </>
    );
    expect(screen.getByText("Oct 15, 2026").closest("button")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Next control" }));
  });

  it("names icon-only values without making them editable", () => {
    render(<ReadOnlyProperty icon={DueDateOutline} tooltip="Due date: None" />);
    expect(screen.getByRole("img", { name: "Due date: None" })).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("retains the full value for assistive technology when long labels are visually truncated", () => {
    const label = "A very long cycle name that must remain available as the complete published value";
    render(<ReadOnlyProperty icon={DueDateOutline} label={label} tooltip={`Cycle: ${label}`} />);
    expect(screen.getByText(label).textContent).toBe(label);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

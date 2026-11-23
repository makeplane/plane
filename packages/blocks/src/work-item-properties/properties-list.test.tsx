/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WorkItemPropertyCountChip } from "./count-chip";
import { WorkItemPropertiesList } from "./properties-list";

describe("WorkItemPropertiesList", () => {
  it("renders every chip in row order inside the container", () => {
    const { container } = render(
      <WorkItemPropertiesList
        className="chips"
        entries={[
          { key: "state", chip: <span>state chip</span> },
          { key: "priority", chip: <span>priority chip</span> },
          { key: "link", chip: <span>link chip</span> },
        ]}
      />
    );
    const root = container.querySelector(".chips");
    expect(root).toBeTruthy();
    expect(Array.from(root?.children ?? []).map((child) => child.textContent)).toEqual([
      "state chip",
      "priority chip",
      "link chip",
    ]);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("keeps the container when there are no entries", () => {
    const { container } = render(<WorkItemPropertiesList className="chips" entries={[]} />);
    expect(container.querySelector(".chips")?.childElementCount).toBe(0);
  });
});

describe("WorkItemPropertyCountChip", () => {
  it("is a display-only, unfocusable chip without onClick", () => {
    render(<WorkItemPropertyCountChip icon={<svg />} count={3} label="Attachments" />);
    const chip = screen.getByRole("img", { name: "Attachments: 3" });
    expect(chip.tagName).toBe("SPAN");
    expect(chip.textContent).toContain("3");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("is a button that reports clicks with onClick", async () => {
    const onClick = vi.fn();
    render(<WorkItemPropertyCountChip icon={<svg />} count={2} label="Links" onClick={onClick} />);
    const chip = screen.getByRole("button", { name: "Links: 2" });
    await userEvent.click(chip);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

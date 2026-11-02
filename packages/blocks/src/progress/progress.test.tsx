/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProgressRing } from "./progress-ring";
import { SegmentedProgress } from "./segmented-progress";

const DATA = [
  { id: "completed", name: "Completed", value: 3, color: "#16A34A" },
  { id: "started", name: "Started", value: 1, color: "#F59E0B" },
  { id: "backlog", name: "Backlog", value: 0, color: "#A3A3A3" },
];

describe("SegmentedProgress", () => {
  it("sizes each segment by its share of the total and skips empty ones", () => {
    render(<SegmentedProgress data={DATA} size="lg" aria-label="Progress" hideTooltip />);

    const bar = screen.getByRole("group", { name: "Progress" });
    expect(bar.className).toContain("h-3.5");
    const segments = Array.from(bar.children) as HTMLElement[];
    expect(segments).toHaveLength(2);
    expect(segments[0].style.width).toBe("75%");
    expect(segments[1].style.width).toBe("25%");
  });

  it("renders an empty track when there is nothing to show", () => {
    render(<SegmentedProgress data={DATA.map((item) => ({ ...item, value: 0 }))} aria-label="Progress" />);

    expect(screen.getByRole("group", { name: "Progress" }).children).toHaveLength(0);
  });

  it("makes segments activatable by click and keyboard when a handler is given", async () => {
    const user = userEvent.setup();
    const onSegmentClick = vi.fn();
    render(<SegmentedProgress data={DATA} onSegmentClick={onSegmentClick} hideTooltip />);

    await user.click(screen.getByRole("button", { name: "Completed" }));
    screen.getByRole("button", { name: "Started" }).focus();
    await user.keyboard("{Enter}");

    expect(onSegmentClick).toHaveBeenNthCalledWith(1, DATA[0]);
    expect(onSegmentClick).toHaveBeenNthCalledWith(2, DATA[1]);
    expect(screen.queryByRole("button", { name: "Backlog" })).toBeNull();
  });

  it("keeps segments inert without a handler", () => {
    render(<SegmentedProgress data={DATA} hideTooltip />);

    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});

describe("ProgressRing", () => {
  it("exposes a clamped progress value when labelled", () => {
    render(<ProgressRing value={140} aria-label="Module progress" />);

    const ring = screen.getByRole("progressbar", { name: "Module progress" });
    expect(ring.getAttribute("aria-valuenow")).toBe("100");
  });

  it("is decorative without a label and renders its centre content", () => {
    render(
      <ProgressRing value={42} size={30} strokeWidth={3}>
        <span>42%</span>
      </ProgressRing>
    );

    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.getByText("42%")).toBeTruthy();
  });

  it("draws only the track at zero progress", () => {
    const { container } = render(<ProgressRing value={0} />);

    expect(container.querySelectorAll("circle")).toHaveLength(1);
  });
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* @vitest-environment jsdom */

import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkloadAllocationBar } from "@/components/dashboards/operations/panels/workload-allocation-bar";
import type { TWorkloadBreakdown } from "@plane/types";

const BREAKDOWN: TWorkloadBreakdown = {
  by: "project",
  basis: "open_or_completed_in_period",
  denominator: 10,
  slices: [
    { group_id: "p1", name: "Platform", count: 6, pct: 60 },
    { group_id: "p2", name: "Mobile", count: 4, pct: 40 },
  ],
};

describe("WorkloadAllocationBar", () => {
  test("renders stacked segments and legend labels", () => {
    render(<WorkloadAllocationBar breakdown={BREAKDOWN} testId="alloc" />);
    expect(screen.getByTestId("alloc")).toBeTruthy();
    expect(screen.getByText("Platform")).toBeTruthy();
    expect(screen.getByText("60%")).toBeTruthy();
    expect(screen.getByTestId("alloc-segment-0")).toBeTruthy();
  });

  test("compact mode hides full legend", () => {
    render(<WorkloadAllocationBar breakdown={BREAKDOWN} compact testId="alloc-compact" />);
    expect(screen.getByText(/Platform 60%/)).toBeTruthy();
    expect(screen.queryByText("Mobile")).toBeNull();
  });
});

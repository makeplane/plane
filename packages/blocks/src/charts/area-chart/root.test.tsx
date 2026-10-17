/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TAreaChartProps } from "@plane/types";
import { AreaChart } from "./root";

const ideal = 8.571428571428573;
const chartProps: TAreaChartProps<string, string> = {
  data: [
    { name: "Oct 9", current: 1.2345, ideal },
    { name: "Oct 10", current: 1.2345, ideal },
  ],
  areas: ["current", "ideal"].map((key) => ({
    key,
    label: key,
    stackId: key,
    fill: "#3F76FF",
    fillOpacity: 0,
    showDot: true,
    smoothCurves: false,
    strokeColor: "#3F76FF",
    strokeOpacity: 1,
  })),
  xAxis: { key: "name" },
  yAxis: { key: "current" },
};

function hoverChart(container: HTMLElement) {
  const chart = container.querySelector(".recharts-wrapper");
  expect(chart).not.toBeNull();
  fireEvent.mouseMove(chart!, { clientX: 100, clientY: 100 });
}

describe("AreaChart tooltip values", () => {
  beforeEach(() => {
    // Match the dimensions from the DOM setup so Recharts can map a real mouse
    // event to a data point even though jsdom does not perform layout.
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 256,
      bottom: 240,
      width: 256,
      height: 240,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps full precision when no formatter is provided", async () => {
    const { container } = render(<AreaChart {...chartProps} />);
    hoverChart(container);

    expect(await screen.findByText(String(ideal))).toBeTruthy();
    expect(screen.getByText("1.2345")).toBeTruthy();
  });

  it("formats the selected series without changing other values or chart data", async () => {
    const dataBefore = structuredClone(chartProps.data);
    const { container } = render(
      <AreaChart
        {...chartProps}
        tooltipValueFormatter={(value, dataKey) => (dataKey === "ideal" ? Number(value.toFixed(1)) : value)}
      />
    );
    hoverChart(container);

    expect(await screen.findByText("8.6")).toBeTruthy();
    expect(screen.getByText("1.2345")).toBeTruthy();
    expect(screen.queryByText(String(ideal))).toBeNull();
    expect(chartProps.data).toEqual(dataBefore);
  });

  it.each([0, 10])("preserves %s without adding a decimal suffix", async (idealValue) => {
    const { container } = render(
      <AreaChart
        {...chartProps}
        data={[{ name: "Oct 9", current: 1.2345, ideal: idealValue }]}
        tooltipValueFormatter={(value, dataKey) => (dataKey === "ideal" ? Number(value.toFixed(1)) : value)}
      />
    );
    hoverChart(container);

    expect(await screen.findByText(String(idealValue), { selector: "span" })).toBeTruthy();
    expect(screen.queryByText(`${idealValue}.0`)).toBeNull();
  });
});

/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import preview from "#.storybook/preview";
import { LineChart } from "./root";

const sampleData = [
  { month: "Jan", actual: 4000, target: 3500 },
  { month: "Feb", actual: 3000, target: 3500 },
  { month: "Mar", actual: 5000, target: 3500 },
  { month: "Apr", actual: 2780, target: 3500 },
  { month: "May", actual: 1890, target: 3500 },
  { month: "Jun", actual: 2390, target: 3500 },
];

const actualLine = {
  key: "actual",
  label: "Actual",
  dashedLine: false,
  fill: "#3b82f6",
  showDot: true,
  smoothCurves: true,
  stroke: "#3b82f6",
} as const;

const targetLine = {
  key: "target",
  label: "Target",
  dashedLine: true,
  fill: "#ef4444",
  showDot: false,
  smoothCurves: false,
  stroke: "#ef4444",
} as const;

const meta = preview.meta({
  title: "Charts/Line Chart",
  component: LineChart,
  parameters: {
    layout: "padded",
  },
  args: {
    className: "w-full h-[300px]",
    data: sampleData,
    lines: [actualLine],
    xAxis: { key: "month" },
    yAxis: { key: "actual" },
  },
});

export const Default = meta.story({});

export const MultiLine = meta.story({
  args: {
    lines: [actualLine, targetLine],
  },
});

export const WithLegend = meta.story({
  args: {
    lines: [actualLine, targetLine],
    xAxis: { key: "month", label: "Month" },
    yAxis: { key: "actual", label: "Value" },
    legend: { layout: "horizontal", align: "center", verticalAlign: "bottom" },
  },
});

export const NoTooltip = meta.story({
  args: {
    showTooltip: false,
  },
});

export const WithAxisLabels = meta.story({
  args: {
    xAxis: { key: "month", label: "Month" },
    yAxis: { key: "actual", label: "Revenue", domain: [0, 6000], allowDecimals: false },
    margin: { top: 10, right: 40, bottom: 30, left: 40 },
  },
});

export const LinearNoDot = meta.story({
  args: {
    lines: [{ ...actualLine, showDot: false, smoothCurves: false }],
  },
});

export const WithCustomTooltipContent = meta.story({
  args: {
    customTooltipContent: ({ label, payload }) => (
      <div className="bg-layer-2 border border-subtle rounded p-2 text-13">
        <div className="font-medium">{label}</div>
        {payload?.map((p: { value: number }, i: number) => (
          <div key={i}>{p.value}</div>
        ))}
      </div>
    ),
  },
});

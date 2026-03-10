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
import { BarChart } from "./root";

const sampleData = [
  { month: "Jan", completed: 40, inProgress: 24, backlog: 10 },
  { month: "Feb", completed: 30, inProgress: 13, backlog: 8 },
  { month: "Mar", completed: 20, inProgress: 28, backlog: 15 },
  { month: "Apr", completed: 27, inProgress: 39, backlog: 12 },
  { month: "May", completed: 18, inProgress: 48, backlog: 20 },
  { month: "Jun", completed: 23, inProgress: 38, backlog: 14 },
];

const completedBar = {
  key: "completed",
  label: "Completed",
  fill: "#22c55e",
  textClassName: "text-green-500",
  stackId: "1",
} as const;

const stackedBars = [
  { key: "completed", label: "Completed", fill: "#22c55e", textClassName: "text-green-500", stackId: "stack" },
  { key: "inProgress", label: "In Progress", fill: "#f59e0b", textClassName: "text-amber-500", stackId: "stack" },
  { key: "backlog", label: "Backlog", fill: "#ef4444", textClassName: "text-red-500", stackId: "stack" },
] as const;

const meta = preview.meta({
  title: "Charts/Bar Chart",
  component: BarChart,
  parameters: {
    layout: "padded",
  },
  args: {
    className: "w-full h-[300px]",
    data: sampleData,
    bars: [completedBar],
    xAxis: { key: "month" },
    yAxis: { key: "completed" },
  },
});

export const Default = meta.story({});

export const Stacked = meta.story({
  args: {
    bars: [...stackedBars],
    barSize: 30,
  },
});

export const WithLegend = meta.story({
  args: {
    bars: [...stackedBars],
    xAxis: { key: "month", label: "Month" },
    yAxis: { key: "completed", label: "Count" },
    legend: { layout: "horizontal", align: "center", verticalAlign: "bottom" },
  },
});

export const WithVerticalLegend = meta.story({
  args: {
    bars: [stackedBars[0], stackedBars[1]],
    legend: { layout: "vertical", align: "right", verticalAlign: "middle" },
  },
});

export const NoTooltip = meta.story({
  args: {
    showTooltip: false,
  },
});

export const WithAxisLabels = meta.story({
  args: {
    xAxis: { key: "month", label: "Month", dy: 28 },
    yAxis: { key: "completed", label: "Tasks", domain: [0, 60], offset: -24, dx: -16, allowDecimals: false },
    margin: { top: 10, right: 40, bottom: 30, left: 40 },
  },
});

export const DynamicFill = meta.story({
  args: {
    bars: [
      {
        ...completedBar,
        fill: (payload: Record<string, unknown>) => ((payload.completed as number) > 25 ? "#22c55e" : "#ef4444"),
      },
    ],
  },
});

export const WithCustomTooltipContent = meta.story({
  args: {
    customTooltipContent: ({ label, payload }) => (
      <div className="bg-layer-2 border border-subtle rounded p-2 text-13">
        <div className="font-medium">{label}</div>
        {payload?.map((p: { value: number }, i: number) => (
          <div key={i}>{p.value} tasks</div>
        ))}
      </div>
    ),
  },
});

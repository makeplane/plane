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
import { ScatterChart } from "./root";

const sampleData = [
  { x: 100, y: 200 },
  { x: 120, y: 100 },
  { x: 170, y: 300 },
  { x: 140, y: 250 },
  { x: 150, y: 400 },
  { x: 110, y: 280 },
  { x: 200, y: 150 },
  { x: 180, y: 320 },
];

const meta = preview.meta({
  component: ScatterChart,
  parameters: {
    layout: "padded",
  },
  args: {
    className: "w-full h-[300px]",
    data: sampleData,
    scatterPoints: [
      {
        key: "y",
        label: "Value",
        fill: "#3b82f6",
        stroke: "#3b82f6",
      },
    ],
    xAxis: { key: "x" },
    yAxis: { key: "y" },
  },
});

export const Default = meta.story({});

export const WithAxisLabels = meta.story({
  args: {
    xAxis: { key: "x", label: "X Axis" },
    yAxis: { key: "y", label: "Y Axis" },
    legend: { layout: "horizontal", align: "center", verticalAlign: "bottom" },
  },
});

export const NoTooltip = meta.story({
  args: {
    showTooltip: false,
  },
});

export const WithCustomTooltipContent = meta.story({
  args: {
    customTooltipContent: ({ payload }) => (
      <div className="bg-layer-2 border border-subtle rounded p-2 text-13">
        {payload?.map((p: { value: number }, i: number) => (
          <div key={i}>Point: {p.value}</div>
        ))}
      </div>
    ),
  },
});

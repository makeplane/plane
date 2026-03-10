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
import { RadarChart } from "./root";

const sampleData = [
  { subject: "Design", teamA: 120, teamB: 90 },
  { subject: "Development", teamA: 98, teamB: 130 },
  { subject: "QA", teamA: 86, teamB: 110 },
  { subject: "DevOps", teamA: 99, teamB: 70 },
  { subject: "Research", teamA: 85, teamB: 95 },
  { subject: "Docs", teamA: 65, teamB: 85 },
];

const teamARadar = {
  key: "teamA",
  name: "Team A",
  fill: "#3b82f6",
  stroke: "#3b82f6",
  fillOpacity: 0.3,
} as const;

const teamBRadar = {
  key: "teamB",
  name: "Team B",
  fill: "#ef4444",
  stroke: "#ef4444",
  fillOpacity: 0.2,
} as const;

const meta = preview.meta({
  title: "Charts/Radar Chart",
  component: RadarChart,
  parameters: {
    layout: "padded",
  },
  args: {
    className: "w-[400px] h-[300px]",
    data: sampleData,
    dataKey: "teamA",
    angleAxis: { key: "subject" },
    showTooltip: true,
    radars: [teamARadar],
  },
});

export const Default = meta.story({});

export const MultiRadar = meta.story({
  args: {
    radars: [{ ...teamARadar, fillOpacity: 0.2 }, teamBRadar],
  },
});

export const WithLegend = meta.story({
  args: {
    radars: [{ ...teamARadar, fillOpacity: 0.2 }, teamBRadar],
    legend: { layout: "horizontal", align: "center", verticalAlign: "bottom" },
  },
});

export const NoTooltip = meta.story({
  args: {
    showTooltip: false,
  },
});

export const WithDotProperty = meta.story({
  args: {
    radars: [{ ...teamARadar, fillOpacity: 0.2, dot: { r: 3, fillOpacity: 1 } }, teamBRadar],
  },
});

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

/**
 * Zod schemas for Pi Chat json-render components.
 *
 * These schemas mirror the @plane/propel component props exactly so that the
 * backend can send data that passes straight through to the React components
 * with zero transformation on the frontend.
 *
 * Propel type references:
 *   - TBarItem, TBarChartProps   → packages/types/src/charts/index.ts
 *   - TLineItem, TLineChartProps → packages/types/src/charts/index.ts
 *   - TCellItem, TPieChartProps  → packages/types/src/charts/index.ts
 *   - ButtonProps                → packages/propel/src/button/helper.tsx
 */

import { z } from "zod";

// ============================================================
// Shared axis schema (used by Bar / Line charts)
// Maps to TAxisChartProps.xAxis / yAxis
// ============================================================

export const axisSchema = z.object({
  key: z.string(),
  label: z.string().optional(),
});

// ============================================================
// Bar Chart — matches TBarItem + TBarChartProps
// ============================================================

export const barItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  fill: z.string(),
  textClassName: z.string().default(""),
  stackId: z.string().default(""),
  showPercentage: z.boolean().optional(),
  showTopBorderRadius: z.function({ input: z.tuple([z.string(), z.any()]), output: z.boolean() }).optional(),
  showBottomBorderRadius: z.function({ input: z.tuple([z.string(), z.any()]), output: z.boolean() }).optional(),
  shapeVariant: z.enum(["bar", "lollipop", "lollipop-dotted"]).optional(),
});

export const barChartPropsSchema = z.object({
  title: z.string().optional(),
  data: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
  bars: z.array(barItemSchema),
  xAxis: axisSchema,
  yAxis: axisSchema,
  barSize: z.number().optional(),
  showTooltip: z.boolean().optional(),
});

// ============================================================
// Line Chart — matches TLineItem + TLineChartProps
// ============================================================

export const lineItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  stroke: z.string(),
  fill: z.string().default(""),
  dashedLine: z.boolean().default(false),
  showDot: z.boolean().default(false),
  smoothCurves: z.boolean().default(false),
  style: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

export const lineChartPropsSchema = z.object({
  title: z.string().optional(),
  data: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
  lines: z.array(lineItemSchema),
  xAxis: axisSchema,
  yAxis: axisSchema,
  showTooltip: z.boolean().optional(),
});

// ============================================================
// Pie Chart — matches TCellItem + TPieChartProps
// ============================================================

export const cellItemSchema = z.object({
  key: z.string(),
  fill: z.string(),
});

export const legendSchema = z.object({
  align: z.enum(["left", "center", "right"]),
  verticalAlign: z.enum(["top", "middle", "bottom"]),
  layout: z.enum(["horizontal", "vertical"]),
});

export const chartMarginSchema = z.object({
  top: z.number().optional(),
  right: z.number().optional(),
  bottom: z.number().optional(),
  left: z.number().optional(),
});

export const centerLabelSchema = z.object({
  className: z.string().optional(),
  fill: z.string(),
  style: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  text: z.union([z.string(), z.number()]).optional(),
});

export const pieChartPropsSchema = z.object({
  title: z.string().optional(),
  data: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
  dataKey: z.string(),
  cells: z.array(cellItemSchema),
  showLabel: z.boolean(),
  showTooltip: z.boolean().optional(),
  legend: legendSchema.optional(),
  innerRadius: z.union([z.number(), z.string()]).optional(),
  outerRadius: z.union([z.number(), z.string()]).optional(),
  cornerRadius: z.number().optional(),
  paddingAngle: z.number().optional(),
  customLabel: z.function({ input: z.tuple([z.any()]), output: z.string() }).optional(),
  centerLabel: centerLabelSchema.optional(),
  tooltipLabel: z.union([z.string(), z.function({ input: z.tuple([z.any()]), output: z.string() })]).optional(),
  customLegend: z.function({ input: z.tuple([z.any()]), output: z.any() }).optional(),
  margin: chartMarginSchema.optional(),
});

// ============================================================
// Button — matches ButtonProps (variant / size from CVA)
// ============================================================

export const buttonPropsSchema = z.object({
  label: z.string(),
  action: z.string(),
  variant: z.enum(["primary", "secondary", "tertiary", "ghost", "link", "error-fill", "error-outline"]).optional(),
  size: z.enum(["sm", "base", "lg", "xl"]).optional(),
  disabled: z.boolean().optional(),
});

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
 * Pi Chat JSON UI Registry & Renderer
 *
 * Maps every catalog component to its @plane/propel React implementation.
 * All props are passed straight through — no transformation required.
 * The backend is expected to send data in the exact shape the propel
 * components accept.
 *
 * To add a new component:
 *   1. Create its props schema in `pi-chat-schema.ts`
 *   2. Register it in the catalog (`pi-chat-catalog.ts`)
 *   3. Add the React implementation to the `components` map below
 */

import React, { useMemo } from "react";
import type { z } from "zod";
// plane imports
import { Button } from "@plane/propel/button";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { PieChart } from "@plane/propel/charts/pie-chart";
import { LineChart } from "@plane/propel/charts/line-chart";
// local imports
import type { TComponentRendererProps, TJsonUISpec } from "./types";
import type {
  barChartPropsSchema,
  buttonPropsSchema,
  lineChartPropsSchema,
  pieChartPropsSchema,
} from "./pi-chat-schema";
import { piChatCatalog } from "./pi-chat-catalog";
import { defineRegistry, JSONUIProvider, Renderer } from "./renderer";

// ============================================================
// Prop types (inferred from Zod schemas)
// ============================================================

type BarChartRendererProps = TComponentRendererProps<z.infer<typeof barChartPropsSchema>>;
type PieChartRendererProps = TComponentRendererProps<z.infer<typeof pieChartPropsSchema>>;
type LineChartRendererProps = TComponentRendererProps<z.infer<typeof lineChartPropsSchema>>;
type ButtonRendererProps = TComponentRendererProps<z.infer<typeof buttonPropsSchema>>;

// ============================================================
// Shared UI Helpers
// ============================================================

/** Chart container with optional title */
const ChartContainer: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="!my-4 rounded-lg border border-subtle-1 p-4">
    {title && <h4 className="mb-3 text-base font-semibold text-primary">{title}</h4>}
    {children}
  </div>
);

// ============================================================
// Registry (maps catalog components → React implementations)
// ============================================================

export const { registry: piChatRegistry } = defineRegistry(piChatCatalog, {
  components: {
    BarChart: ({ props }: BarChartRendererProps) => (
      <ChartContainer title={props.title}>
        <BarChart
          className="h-[300px] w-full"
          data={props.data}
          bars={props.bars}
          xAxis={props.xAxis}
          yAxis={{ ...props.yAxis, offset: 0, dx: 0, position: "insideLeft", style: { textAnchor: "middle" } }}
          barSize={props.barSize ?? 40}
          showTooltip={props.showTooltip !== false}
        />
      </ChartContainer>
    ),

    PieChart: ({ props }: PieChartRendererProps) => (
      <ChartContainer title={props.title}>
        <PieChart
          className="h-[300px] w-full"
          data={props.data}
          dataKey={props.dataKey}
          cells={props.cells}
          showLabel={props.showLabel !== false}
          showTooltip={props.showTooltip !== false}
          legend={props.legend}
          tooltipLabel={(payload) => payload?.name ?? payload?.key ?? ""}
        />
      </ChartContainer>
    ),

    LineChart: ({ props }: LineChartRendererProps) => (
      <ChartContainer title={props.title}>
        <LineChart
          className="h-[300px] w-full"
          data={props.data}
          lines={props.lines}
          xAxis={props.xAxis}
          yAxis={{ ...props.yAxis, offset: 0, position: "center", style: { textAnchor: "middle" } }}
          showTooltip={props.showTooltip !== false}
        />
      </ChartContainer>
    ),

    Button: ({ props, emit }: ButtonRendererProps) => (
      <Button
        variant={props.variant ?? "primary"}
        size={props.size ?? "base"}
        disabled={props.disabled}
        onClick={() => emit?.("press")}
      >
        {props.label}
      </Button>
    ),
  },
});

// ============================================================
// PiJsonRenderer Component
// ============================================================

/**
 * Renders AI-generated JSON UI specs.
 *
 * Accepts a raw JSON string (from a fenced code block), parses it,
 * and renders via the Pi chat registry.
 *
 * Gracefully handles partial/invalid JSON during streaming by
 * rendering nothing until a valid spec is available.
 */
export const PiJsonRenderer: React.FC<{ jsonString: string }> = ({ jsonString }) => {
  const spec = useMemo<TJsonUISpec | null>(() => {
    try {
      const parsed: unknown = JSON.parse(jsonString);
      // Validate that the parsed JSON has the expected spec shape
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "root" in parsed &&
        "elements" in parsed &&
        typeof (parsed as TJsonUISpec).root === "string" &&
        typeof (parsed as TJsonUISpec).elements === "object"
      ) {
        return parsed as TJsonUISpec;
      }
      return null;
    } catch {
      return null;
    }
  }, [jsonString]);

  if (!spec) return null;

  return (
    <JSONUIProvider registry={piChatRegistry}>
      <Renderer spec={spec} registry={piChatRegistry} />
    </JSONUIProvider>
  );
};

// ============================================================
// Markdown `pre` override for react-markdown
// ============================================================

/**
 * Drop-in `pre` component override for react-markdown.
 *
 * react-markdown renders fenced code blocks as `<pre><code class="language-xxx">…</code></pre>`.
 * This component checks the inner `<code>` className — if it matches a JSON UI
 * language marker (```ui or ```chart), the content is rendered via `PiJsonRenderer`.
 * Everything else falls through to a normal `<pre>`.
 */
export const JsonRenderPreBlock: React.FC<React.ComponentProps<"pre">> = ({ children, ...rest }) => {
  const child = Array.isArray(children) ? children[0] : children;

  if (
    React.isValidElement<{ className?: string; children?: React.ReactNode }>(child) &&
    typeof child.props.className === "string" &&
    /language-(ui|chart)/.test(child.props.className)
  ) {
    const raw = child.props.children;
    const jsonString = (typeof raw === "string" ? raw : Array.isArray(raw) ? raw.join("") : "").trim();
    return <PiJsonRenderer jsonString={jsonString} />;
  }

  return <pre {...rest}>{children}</pre>;
};

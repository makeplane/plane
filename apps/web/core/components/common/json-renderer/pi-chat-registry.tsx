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
// plane imports
import { Button } from "@plane/propel/button";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { PieChart } from "@plane/propel/charts/pie-chart";
import { LineChart } from "@plane/propel/charts/line-chart";
// local imports
import type { TJsonUISpec } from "./types";
import { barChartPropsSchema, buttonPropsSchema, lineChartPropsSchema, pieChartPropsSchema } from "./pi-chat-schema";
import { piChatCatalog } from "./pi-chat-catalog";
import { defineRegistry, JSONUIProvider, Renderer } from "./renderer";
import { isObject } from "@plane/utils";
import { ErrorBoundary } from "../error-boundary";
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
    BarChart: ({ props }) => {
      const parsed = barChartPropsSchema.safeParse(props);
      if (!parsed.success) {
        console.warn("[PiChat/BarChart] Invalid props", parsed.error.flatten());
        return null;
      }
      const p = parsed.data;
      return (
        <ChartContainer title={p.title}>
          <BarChart
            className="h-[300px] w-full"
            data={p.data}
            bars={p.bars}
            xAxis={p.xAxis}
            yAxis={{ ...p.yAxis, offset: 0, dx: 0, position: "insideLeft", style: { textAnchor: "middle" } }}
            barSize={p.barSize ?? 40}
            showTooltip={p.showTooltip !== false}
          />
        </ChartContainer>
      );
    },

    PieChart: ({ props }) => {
      const parsed = pieChartPropsSchema.safeParse(props);
      if (!parsed.success) {
        console.warn("[PiChat/PieChart] Invalid props", parsed.error.flatten());
        return null;
      }
      const p = parsed.data;
      return (
        <ChartContainer title={p.title}>
          <PieChart
            className="h-[300px] w-full"
            data={p.data}
            dataKey={p.dataKey}
            cells={p.cells}
            showLabel={p.showLabel}
            showTooltip={p.showTooltip !== false}
            legend={p.legend}
            tooltipLabel={(payload) => payload?.name ?? payload?.key ?? ""}
          />
        </ChartContainer>
      );
    },

    LineChart: ({ props }) => {
      const parsed = lineChartPropsSchema.safeParse(props);
      if (!parsed.success) {
        console.warn("[PiChat/LineChart] Invalid props", parsed.error.flatten());
        return null;
      }
      const p = parsed.data;
      return (
        <ChartContainer title={p.title}>
          <LineChart
            className="h-[300px] w-full"
            data={p.data}
            lines={p.lines}
            xAxis={p.xAxis}
            yAxis={{ ...p.yAxis, offset: 0, position: "center", style: { textAnchor: "middle" } }}
            showTooltip={p.showTooltip !== false}
          />
        </ChartContainer>
      );
    },

    Button: ({ props, emit }) => {
      const parsed = buttonPropsSchema.safeParse(props);
      if (!parsed.success) {
        console.warn("[PiChat/Button] Invalid props", parsed.error.flatten());
        return null;
      }
      const p = parsed.data;
      return (
        <Button
          variant={p.variant ?? "primary"}
          size={p.size ?? "base"}
          disabled={p.disabled}
          onClick={() => emit?.("press")}
        >
          {p.label}
        </Button>
      );
    },
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
        isObject(parsed) &&
        "root" in parsed &&
        "elements" in parsed &&
        typeof parsed.root === "string" &&
        isObject(parsed.elements)
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
    <ErrorBoundary
      fallback={<div className="border border-subtle-1 bg-layer-1 p-4 rounded-lg">Error rendering JSON UI</div>}
    >
      <JSONUIProvider registry={piChatRegistry}>
        <Renderer spec={spec} registry={piChatRegistry} />
      </JSONUIProvider>
    </ErrorBoundary>
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

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * DOM id of the gantt chart content div — the element that holds the block
 * rows, the dependency SVG overlays, and the header offset. Block positions
 * (`blocksMap[id].position.marginLeft`) and dragPoint coordinates are both
 * expressed relative to this element's top-left corner, so every client→chart
 * conversion in the dependency feature goes through here.
 */
export const CHART_CONTENT_ID = "gantt-chart-content";

export function getChartContentRect(): DOMRect | null {
  const el = typeof document !== "undefined" ? document.getElementById(CHART_CONTENT_ID) : null;
  return el?.getBoundingClientRect() ?? null;
}

/**
 * Convert a viewport-relative point to chart-local coordinates. Returns null
 * if the chart content element isn't in the DOM (e.g. the gantt view
 * unmounted mid-drag).
 */
export function clientToChart(clientX: number, clientY: number): { x: number; y: number } | null {
  const rect = getChartContentRect();
  if (!rect) return null;
  return { x: clientX - rect.left, y: clientY - rect.top };
}

/**
 * Chart-local anchor for a block edge, derived from the block's current DOM
 * rect. We take the rect once at drag start so later scrolling doesn't shift
 * the source endpoint under the user.
 */
export function blockEdgeAnchor(blockEl: Element, edge: "left" | "right"): { x: number; y: number } | null {
  const chartRect = getChartContentRect();
  if (!chartRect) return null;
  const blockRect = blockEl.getBoundingClientRect();
  const x = edge === "right" ? blockRect.right - chartRect.left : blockRect.left - chartRect.left;
  const y = (blockRect.top + blockRect.bottom) / 2 - chartRect.top;
  return { x, y };
}

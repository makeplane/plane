/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Minimum horizontal control-handle length (px). Without a floor the curve
 * collapses onto its chord — a bare diagonal line — whenever the two anchors
 * are horizontally close (adjacent tasks), which is exactly the ugly case.
 */
const MIN_HANDLE = 24;

/**
 * Build a cubic Bézier SVG path between two anchor points used for timeline
 * dependency lines. The two control points are offset horizontally by at least
 * `MIN_HANDLE`, or `|x2 - x1| / 2` when larger, producing the Jira/Linear-like
 * side-slider look regardless of drag direction.
 *
 * All coordinates are in the gantt chart SVG local coordinate system (the
 * caller is responsible for translating clientX/clientY into that system).
 */
export function buildBezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const horizontalOffset = Math.max(Math.abs(x2 - x1) / 2, MIN_HANDLE);
  // Horizontally extend the control points; leaving y untouched preserves
  // the smooth S-curve between two different rows.
  const cx1 = x1 + horizontalOffset;
  const cy1 = y1;
  const cx2 = x2 - horizontalOffset;
  const cy2 = y2;
  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
}

export type TDependencyEdge = "left" | "right";

/**
 * Anchor point of a gantt block on the chart (center Y, left/right X depending
 * on which edge was grabbed). `marginLeft` / `width` come from
 * `BaseTimeLineStore.blocksMap[id].position` so the returned values live in the
 * chart-local coordinate system.
 */
export function getBlockAnchor(
  marginLeft: number,
  width: number,
  rowTop: number,
  rowHeight: number,
  edge: TDependencyEdge
): { x: number; y: number } {
  const y = rowTop + rowHeight / 2;
  const x = edge === "right" ? marginLeft + width : marginLeft;
  return { x, y };
}

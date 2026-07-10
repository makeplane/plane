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

type TPoint = { x: number; y: number };

/** Horizontal stub each block edge keeps before the path may turn (px). */
const ELBOW_STUB = 20;
/** Corner radius (px); clamped per-corner to half the shorter adjacent segment. */
const ELBOW_RADIUS = 8;

/**
 * Convert an orthogonal polyline into an SVG path with rounded corners.
 * Each corner radius is clamped to half of both adjacent segments so short
 * or degenerate segments never produce self-overlapping arcs.
 */
function roundedPathFromPolyline(points: TPoint[], radius: number): string {
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const corner = points[i];
    const next = points[i + 1];
    const inLen = Math.hypot(corner.x - prev.x, corner.y - prev.y);
    const outLen = Math.hypot(next.x - corner.x, next.y - corner.y);
    if (inLen === 0 || outLen === 0) continue;
    const r = Math.min(radius, inLen / 2, outLen / 2);
    const inUx = (corner.x - prev.x) / inLen;
    const inUy = (corner.y - prev.y) / inLen;
    const outUx = (next.x - corner.x) / outLen;
    const outUy = (next.y - corner.y) / outLen;
    d += ` L ${corner.x - inUx * r} ${corner.y - inUy * r}`;
    d += ` Q ${corner.x} ${corner.y} ${corner.x + outUx * r} ${corner.y + outUy * r}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/**
 * Orthogonal elbow route between a source block's right edge and a target
 * block's left edge. Forward links with enough gap drop vertically at the
 * horizontal midpoint; tight or backward links route out, across the row
 * midline, and back in — the classic Gantt wrap-around.
 */
export function buildElbowPath(x1: number, y1: number, x2: number, y2: number): string {
  if (x2 - x1 >= 2 * ELBOW_STUB) {
    const midX = (x1 + x2) / 2;
    return roundedPathFromPolyline(
      [
        { x: x1, y: y1 },
        { x: midX, y: y1 },
        { x: midX, y: y2 },
        { x: x2, y: y2 },
      ],
      ELBOW_RADIUS
    );
  }
  const outX = x1 + ELBOW_STUB;
  const inX = x2 - ELBOW_STUB;
  const midY = (y1 + y2) / 2;
  return roundedPathFromPolyline(
    [
      { x: x1, y: y1 },
      { x: outX, y: y1 },
      { x: outX, y: midY },
      { x: inX, y: midY },
      { x: inX, y: y2 },
      { x: x2, y: y2 },
    ],
    ELBOW_RADIUS
  );
}

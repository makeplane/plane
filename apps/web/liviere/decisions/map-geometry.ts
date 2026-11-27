/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: geometry of the lines of the decision map, from the centres of the number dots measured
// on the page. Tested by map-geometry.test.mjs under `node --test`: keep it free of runtime imports.

import type { TMapEdge } from "./model";

// Centre of a number dot relative to the map container, and its width
export type TDotPosition = { x: number; y: number; width: number };

export type TMapLine = TMapEdge & { path: string };

// Dots closer than this horizontally are in the same column: the line bends out through the left margin
export const SAME_COLUMN_PX = 40;

const round = (value: number) => value.toFixed(1);

/** SVG path of one line: an arc through the left margin within a column, a gentle curve between columns. */
export function linePath(from: TDotPosition, to: TDotPosition): string {
  if (Math.abs(from.x - to.x) < SAME_COLUMN_PX) {
    const x1 = from.x - from.width / 2;
    const x2 = to.x - to.width / 2;
    const bulge = Math.min(24, 10 + Math.abs(to.y - from.y) * 0.06);
    return `M${round(x1)} ${round(from.y)} C${round(x1 - bulge)} ${round(from.y)} ${round(x2 - bulge)} ${round(to.y)} ${round(x2)} ${round(to.y)}`;
  }
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const bend = Math.min(40, length * 0.18);
  return `M${round(from.x)} ${round(from.y)} Q${round(mx - (dy / length) * bend)} ${round(my + (dx / length) * bend)} ${round(to.x)} ${round(to.y)}`;
}

export const touches = (line: TMapEdge, number: number | null) =>
  number !== null && (line.from === number || line.to === number);

/** Lines of the edges whose both ends are on the map (a dot of a decision not shown has no position). */
export function mapLines(edges: TMapEdge[], positions: Map<number, TDotPosition>): TMapLine[] {
  const lines: TMapLine[] = [];
  for (const edge of edges) {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (from && to) lines.push({ ...edge, path: linePath(from, to) });
  }
  return lines;
}

/**
 * The lines to draw (the owner's decision: a full web of lines is unreadable). None by default; those of the
 * highlighted or opened decision ("supersedes" and "related", within a box and between boxes); all of them only
 * when asked for.
 */
export function visibleLines(lines: TMapLine[], focus: number | null, showAll: boolean): TMapLine[] {
  if (showAll) return lines;
  if (focus === null) return [];
  return lines.filter((line) => touches(line, focus));
}

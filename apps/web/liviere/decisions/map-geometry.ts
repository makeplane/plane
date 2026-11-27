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

// local: both ends are in the same area box
export type TMapLine = TMapEdge & { path: string; local: boolean };

// Dots closer than this horizontally are in the same column: the line bends out through the left margin
export const SAME_COLUMN_PX = 40;
// Above this many lines the map draws only those of the highlighted or opened decision, unless asked for all
export const ALL_LINES_LIMIT = 120;

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

/**
 * Lines of the edges whose both ends are on the map (a dot of a decision not shown has no position); `boxOf`
 * gives the area box of each decision.
 */
export function mapLines(
  edges: TMapEdge[],
  positions: Map<number, TDotPosition>,
  boxOf: Map<number, string> = new Map()
): TMapLine[] {
  const lines: TMapLine[] = [];
  for (const edge of edges) {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    const box = boxOf.get(edge.from);
    if (from && to)
      lines.push({ ...edge, path: linePath(from, to), local: box !== undefined && box === boxOf.get(edge.to) });
  }
  return lines;
}

/**
 * The lines to draw, so that a busy map stays readable:
 * - "related" lines within one area box only for the highlighted or opened decision (their arcs through the
 *   left margin of a box merge into one thick line otherwise);
 * - above ALL_LINES_LIMIT of the rest, only the lines of the highlighted or opened decision;
 * - everything when asked for all.
 */
export function visibleLines(lines: TMapLine[], focus: number | null, showAll: boolean): TMapLine[] {
  if (showAll) return lines;
  const drawn = lines.filter((line) => !line.local || line.type !== "related" || touches(line, focus));
  if (drawn.length <= ALL_LINES_LIMIT) return drawn;
  if (focus === null) return [];
  return drawn.filter((line) => touches(line, focus));
}

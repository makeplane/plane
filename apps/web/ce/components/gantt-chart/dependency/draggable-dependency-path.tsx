/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import { buildBezierPath } from "./build-bezier";
import { hasBlockingDateConflict } from "./date-check";
import { useDependencyDrag } from "./use-dependency-drag";
import { RelationTypePicker } from "./relation-type-picker";

/** Marker ids scoped to the live-drag SVG so they don't collide with the
 *  confirmed-path SVG elsewhere in the chart. */
const DRAG_MARKER_OK = "gantt-dep-drag-arrow-ok";
const DRAG_MARKER_WARN = "gantt-dep-drag-arrow-warn";
/**
 * Plane resets Tailwind's default colour palette via `--color-*: initial;`,
 * so utility classes like `stroke-blue-500` produce undefined CSS vars and
 * the stroke silently falls back to `none`. We reference Plane's own
 * theme tokens directly via SVG attributes instead.
 */
const COLOR_OK = "var(--brand-default)";
const COLOR_WARN = "var(--red-500)";

/**
 * SVG overlay rendered while the user is dragging a dependency.
 *
 * Absolute-positioned inside `#gantt-chart-content` so its local (0, 0)
 * matches the chart-local coordinate system used by both
 * `dragSource.anchor` and `dragPoint`.
 *
 * Always `pointer-events: none` — the live bezier must never block
 * `document.elementFromPoint` from seeing the block underneath, otherwise
 * the hover/drop target detection would fail over the line itself.
 */
export const TimelineDraggablePath = observer(function TimelineDraggablePath() {
  const store = useTimeLineChartStore();
  // The hook owns its own listeners; invoking it here ties the gesture to the
  // same observer that renders the live bezier.
  const { pickerPayload, resolvePicker } = useDependencyDrag();

  const source = store.dragSource;
  const point = store.dragPoint;
  const target = store.dragTarget;

  if (!source || !point) {
    return pickerPayload ? <RelationTypePicker payload={pickerPayload} onResolve={resolvePicker} /> : null;
  }

  const path = buildBezierPath(source.anchor.x, source.anchor.y, point.x, point.y);

  // Red state covers both hard-invalid (self-reference, duplicate, cycle) and
  // soft-invalid schedule conflicts so the colour semantics match the
  // confirmed lines. The hook only blocks commit for hard invalids; schedule
  // conflicts still commit but surface as a warning via the red line.
  const isInvalid = target !== null && !target.isValid;
  let hasDateConflict = false;
  if (!isInvalid && target) {
    const sourceBlock = store.blocksMap[source.blockId];
    const targetBlock = store.blocksMap[target.blockId];
    if (sourceBlock && targetBlock) {
      // right→left = `source blocking target`; left→right mirrors the
      // direction so we invert the date check accordingly.
      if (source.edge === "right" && target.edge === "left") {
        hasDateConflict = hasBlockingDateConflict(sourceBlock, targetBlock);
      } else if (source.edge === "left" && target.edge === "right") {
        hasDateConflict = hasBlockingDateConflict(targetBlock, sourceBlock);
      }
    }
  }
  const isWarn = isInvalid || hasDateConflict;

  return (
    <>
      <svg
        // Inline `inset: 0` so the overlay exactly covers the chart content
        // div regardless of future Tailwind class changes.
        style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}
        aria-hidden
      >
        <defs>
          <marker
            id={DRAG_MARKER_OK}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={COLOR_OK} />
          </marker>
          <marker
            id={DRAG_MARKER_WARN}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={COLOR_WARN} />
          </marker>
        </defs>
        <path
          d={path}
          fill="none"
          strokeWidth={2}
          // Dashed while free-floating or warning; solid when locked onto a
          // schedule-consistent target.
          strokeDasharray={target && !isWarn ? undefined : "6 4"}
          stroke={isWarn ? COLOR_WARN : COLOR_OK}
          markerEnd={`url(#${isWarn ? DRAG_MARKER_WARN : DRAG_MARKER_OK})`}
        />
      </svg>
      {pickerPayload && <RelationTypePicker payload={pickerPayload} onResolve={resolvePicker} />}
    </>
  );
});

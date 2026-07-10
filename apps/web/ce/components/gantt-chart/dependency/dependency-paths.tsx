/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { cn } from "@plane/utils";
import { BLOCK_HEIGHT } from "@/components/gantt-chart/constants";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import type { TIssueRelationTypes } from "@/plane-web/types";
import { buildElbowPath } from "./build-bezier";
import { hasBlockingDateConflict } from "./date-check";

type Props = {
  isEpic?: boolean;
};

/**
 * A line to draw between two blocks, already canonicalised (no mirror
 * duplicates) and resolved to chart-local geometry.
 */
type TDependencyLine = {
  sourceId: string;
  targetId: string;
  relationType: TIssueRelationTypes;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** True when `source.target_date > target.start_date` — schedule mismatch. */
  hasConflict: boolean;
};

/** Tail-end gap so the arrow head doesn't overlap the target block's left edge. */
const ARROW_GAP = 4;
/** SVG <marker> ids — one per state. */
const ARROW_MARKER_OK = "gantt-dep-arrow-ok";
const ARROW_MARKER_CONFLICT = "gantt-dep-arrow-conflict";
/**
 * Plane resets Tailwind's default colour palette via `--color-*: initial;`,
 * so utility classes like `stroke-blue-500` produce undefined CSS vars and
 * the stroke silently falls back to `none`. We reference Plane's own
 * theme tokens directly via SVG attributes instead.
 */
const COLOR_OK = "var(--brand-default)";
const COLOR_CONFLICT = "var(--red-500)";

/** Wide invisible hover strip so pointer can pick the line without pixel-perfect aim. */
const HOVER_STROKE_WIDTH = 14;
/** Visual stroke width. */
const LINE_STROKE_WIDTH = 2;
/** Delete affordance — WCAG minimum touch target. */
const DELETE_BUTTON_SIZE = 44;

/**
 * Confirmed dependency lines between gantt blocks.
 *
 * Render contract:
 *   - `position: absolute; inset: 0;` inside `#gantt-chart-content` so the
 *     SVG coordinate system matches `blocksMap[*].position.marginLeft` and
 *     our row-index math directly.
 *   - Overall SVG is `pointer-events: none`; only the hover strip and × button
 *     opt back in, so block clicks still reach the blocks underneath.
 */
export const TimelineDependencyPaths = observer(function TimelineDependencyPaths(_props: Props) {
  const store = useTimeLineChartStore();
  const { relation } = useIssueDetail();
  const { workspaceSlug } = useParams<{ workspaceSlug?: string }>();
  const { t } = useTranslation();
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);

  // Computed inline rather than via `useMemo` — the store's `relationMap`,
  // `blocksMap`, and `blockIds` are MobX observables whose object identity
  // stays stable across mutations. `useMemo` with those as deps would always
  // hit the cache and stale-render the lines. The enclosing `observer`
  // tracks the individual observable reads below, so MobX re-renders this
  // component on the next microtask after `createCurrentRelation` mutates
  // the map.
  const lines: TDependencyLine[] = [];
  if (store.blockIds) {
    const blockIds = store.blockIds;
    const blocksMap = store.blocksMap;
    const relationMap = relation.relationMap;
    // Row index lookup — blocks stack vertically at `rowIndex * BLOCK_HEIGHT`.
    const rowIndexOf = new Map<string, number>();
    blockIds.forEach((id, idx) => rowIndexOf.set(id, idx));

    for (const sourceId of blockIds) {
      const sourceBlock = blocksMap[sourceId];
      if (!sourceBlock?.position) continue;
      const sourceRow = rowIndexOf.get(sourceId);
      if (sourceRow === undefined) continue;
      const sourceY = sourceRow * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;

      // Only iterate `blocking` — the `blocked_by` entry on the other block
      // mirrors the same edge, so iterating both would double-render.
      const targets = relationMap[sourceId]?.blocking ?? [];
      for (const targetId of targets) {
        const targetBlock = blocksMap[targetId];
        if (!targetBlock?.position) continue;
        const targetRow = rowIndexOf.get(targetId);
        if (targetRow === undefined) continue;
        const targetY = targetRow * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;

        lines.push({
          sourceId,
          targetId,
          relationType: "blocking",
          x1: sourceBlock.position.marginLeft + sourceBlock.position.width,
          y1: sourceY,
          // Leave a small gap before the block edge so the arrow head sits in
          // clear space rather than blending into the block.
          x2: targetBlock.position.marginLeft - ARROW_GAP,
          y2: targetY,
          hasConflict: hasBlockingDateConflict(sourceBlock, targetBlock),
        });
      }
    }
  }

  // Resolve the project scope for removeRelation per line. `useParams` only
  // reliably gives us `workspaceSlug` for the top-level issue gantt — the
  // project id varies per line because cross-project relations are allowed.
  const handleRemove = async (line: TDependencyLine) => {
    const sourceBlock = store.blocksMap[line.sourceId];
    const projectId = (sourceBlock?.data as { project_id?: string } | undefined)?.project_id;
    if (!workspaceSlug || !projectId) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error.label"),
        message: t("gantt_dependency.creation_failed"),
      });
      return;
    }
    try {
      await relation.removeRelation(workspaceSlug, projectId, line.sourceId, line.relationType, line.targetId);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error.label"),
        message: t("gantt_dependency.creation_failed"),
      });
    }
  };

  if (lines.length === 0) return null;

  return (
    <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }} aria-hidden>
      <defs>
        {/* Shared arrowhead markers. `orient="auto"` rotates the head along
         * the path tangent at the endpoint so it points at the target block. */}
        <marker
          id={ARROW_MARKER_OK}
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
          id={ARROW_MARKER_CONFLICT}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={COLOR_CONFLICT} />
        </marker>
      </defs>
      {lines.map((line) => {
        const d = buildElbowPath(line.x1, line.y1, line.x2, line.y2);
        const midX = (line.x1 + line.x2) / 2;
        const midY = (line.y1 + line.y2) / 2;
        const key = `${line.sourceId}-${line.relationType}-${line.targetId}`;
        const isHovered = hoveredLine === key;
        const markerId = line.hasConflict ? ARROW_MARKER_CONFLICT : ARROW_MARKER_OK;
        return (
          <g key={key} data-dependency-key={key}>
            {/* Visible path. Blue when dates are consistent with the
             * `source blocking target` direction, red when the source's end
             * date falls after the target's start. */}
            <path
              d={d}
              fill="none"
              stroke={line.hasConflict ? COLOR_CONFLICT : COLOR_OK}
              className={cn("transition-opacity", {
                "opacity-100": isHovered,
                "opacity-70": !isHovered,
              })}
              strokeWidth={LINE_STROKE_WIDTH}
              markerEnd={`url(#${markerId})`}
            />
            {/* Invisible click/hover hit strip. */}
            <path
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth={HOVER_STROKE_WIDTH}
              style={{ pointerEvents: "stroke", cursor: "pointer" }}
              onMouseEnter={() => setHoveredLine(key)}
              onMouseLeave={() => setHoveredLine((curr) => (curr === key ? null : curr))}
            />
            {isHovered && (
              <foreignObject
                x={midX - DELETE_BUTTON_SIZE / 2}
                y={midY - DELETE_BUTTON_SIZE / 2}
                width={DELETE_BUTTON_SIZE}
                height={DELETE_BUTTON_SIZE}
                style={{ pointerEvents: "auto", overflow: "visible" }}
              >
                <button
                  type="button"
                  // 20x20 visible button centred in the 44x44 touch target so
                  // the hit area stays WCAG-compliant without a huge visual.
                  className="flex h-full w-full items-center justify-center"
                  onClick={() => handleRemove(line)}
                  onMouseEnter={() => setHoveredLine(key)}
                  onMouseLeave={() => setHoveredLine((curr) => (curr === key ? null : curr))}
                  aria-label={t("gantt_dependency.delete_confirm")}
                  title={t("gantt_dependency.delete_confirm")}
                >
                  <span className="border-custom-border-200 bg-custom-background-100 text-xs text-custom-text-200 shadow-sm hover:bg-custom-background-80 flex h-5 w-5 items-center justify-center rounded-full border leading-none font-semibold">
                    ×
                  </span>
                </button>
              </foreignObject>
            )}
          </g>
        );
      })}
    </svg>
  );
});

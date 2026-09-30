/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/types";
import { BLOCK_HEIGHT } from "@/components/gantt-chart/constants";
import {
  buildDependencyPathD,
  buildGanttDependencyEdges,
  getBlockAnchorPoints,
} from "@/helpers/gantt-dependency-helpers";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";

type Props = {
  isEpic?: boolean;
};

const DEP_STROKE = "var(--txt-secondary)";
const DEP_MARKER = "color-mix(in srgb, var(--txt-secondary) 72%, black)";
const DEP_STROKE_INVALID = "#DC2626";
const DEP_MARKER_INVALID = "#B91C1C";

export const TimelineDependencyPaths = observer(function TimelineDependencyPaths(_props: Props) {
  const { blockIds, getBlockById, isDependencyEnabled } = useTimeLineChartStore();
  const {
    relation,
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.ISSUES);

  if (!isDependencyEnabled || !blockIds?.length) return null;

  const relationMap = relation.relationMap;
  const getDates = (issueId: string) => {
    const issue = getIssueById(issueId);
    const block = getBlockById(issueId);
    return {
      start_date: issue?.start_date ?? block?.start_date ?? null,
      target_date: issue?.target_date ?? block?.target_date ?? null,
    };
  };

  const edges = buildGanttDependencyEdges(blockIds, relationMap, getDates);
  if (!edges.length) return null;

  const indexById = new Map(blockIds.map((id, index) => [id, index]));

  return (
    <svg className="pointer-events-none absolute inset-0 z-[6] h-full w-full overflow-visible">
      <defs>
        <marker id="gantt-dep-arrow" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={DEP_MARKER} />
        </marker>
        <marker id="gantt-dep-arrow-invalid" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={DEP_MARKER_INVALID} />
        </marker>
      </defs>
      {edges.map((edge) => {
        const fromBlock = getBlockById(edge.sourceId);
        const toBlock = getBlockById(edge.targetId);
        const fromIndex = indexById.get(edge.sourceId);
        const toIndex = indexById.get(edge.targetId);
        if (!fromBlock || !toBlock || fromIndex === undefined || toIndex === undefined) return null;

        const fromAnchor = getBlockAnchorPoints(fromBlock, fromIndex, BLOCK_HEIGHT);
        const toAnchor = getBlockAnchorPoints(toBlock, toIndex, BLOCK_HEIGHT);
        if (!fromAnchor || !toAnchor) return null;

        const d = buildDependencyPathD(fromAnchor.right.x, fromAnchor.right.y, toAnchor.left.x, toAnchor.left.y);
        const stroke = edge.isInvalid ? DEP_STROKE_INVALID : DEP_STROKE;
        return (
          <path
            key={edge.id}
            d={d}
            fill="none"
            stroke={stroke}
            strokeWidth={2}
            markerEnd={edge.isInvalid ? "url(#gantt-dep-arrow-invalid)" : "url(#gantt-dep-arrow)"}
          />
        );
      })}
    </svg>
  );
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { buildDependencyPathD } from "@/helpers/gantt-dependency-helpers";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";

const DEP_DRAG_STROKE = "var(--txt-accent-primary)";
const DEP_DRAG_MARKER = "color-mix(in srgb, var(--txt-accent-primary) 72%, black)";

export const TimelineDraggablePath = observer(function TimelineDraggablePath() {
  const { dependencyDrag, isDependencyEnabled } = useTimeLineChartStore();

  if (!isDependencyEnabled || !dependencyDrag) return null;

  const d = buildDependencyPathD(
    dependencyDrag.startX,
    dependencyDrag.startY,
    dependencyDrag.currentX,
    dependencyDrag.currentY
  );

  return (
    <svg className="pointer-events-none absolute inset-0 z-[9] h-full w-full overflow-visible">
      <defs>
        <marker id="gantt-dep-drag-arrow" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={DEP_DRAG_MARKER} />
        </marker>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={DEP_DRAG_STROKE}
        strokeWidth={2}
        strokeDasharray="5 4"
        markerEnd="url(#gantt-dep-drag-arrow)"
      />
    </svg>
  );
});

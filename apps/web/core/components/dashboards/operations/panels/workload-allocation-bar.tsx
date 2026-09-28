/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TWorkloadBreakdown } from "@plane/types";

const SEGMENT_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#64748b"];

interface Props {
  breakdown: TWorkloadBreakdown | undefined;
  compact?: boolean;
  testId?: string;
}

/** Stacked bar + legend: member's project/label mix (% of period-relevant work). */
export function WorkloadAllocationBar({
  breakdown,
  compact = false,
  testId = "workload-allocation-bar",
}: Props): React.ReactElement | null {
  if (!breakdown || breakdown.slices.length === 0 || breakdown.denominator <= 0) {
    return compact ? null : (
      <span className="text-11 text-tertiary" data-testid={`${testId}-empty`}>
        —
      </span>
    );
  }

  const slices = breakdown.slices;
  const barHeight = compact ? "h-1.5" : "h-2";

  return (
    <div className="flex min-w-0 flex-col gap-1" data-testid={testId}>
      <div
        className={`flex w-full overflow-hidden rounded-sm border border-subtle bg-layer-2 ${barHeight}`}
        role="img"
        aria-label={slices.map((s) => `${s.name} ${s.pct}%`).join(", ")}
      >
        {slices.map((slice, index) => (
          <div
            key={`${slice.group_id ?? "none"}-${slice.name}`}
            className="h-full min-w-[2px]"
            style={{
              width: `${Math.max(slice.pct, slice.pct > 0 ? 2 : 0)}%`,
              backgroundColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
            }}
            title={`${slice.name}: ${slice.pct}% (${slice.count})`}
            data-testid={`${testId}-segment-${index}`}
          />
        ))}
      </div>
      {!compact ? (
        <ul className="flex flex-wrap gap-x-2 gap-y-0.5 text-10 text-secondary">
          {slices.map((slice, index) => (
            <li key={`${slice.group_id ?? "none"}-${slice.name}-legend`} className="inline-flex items-center gap-1">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length] }}
                aria-hidden="true"
              />
              <span className="max-w-[120px] truncate" title={slice.name}>
                {slice.name}
              </span>
              <span className="font-mono text-primary tabular-nums">{slice.pct}%</span>
            </li>
          ))}
        </ul>
      ) : (
        <span className="truncate text-10 text-tertiary">
          {slices
            .slice(0, 3)
            .map((s) => `${s.name} ${s.pct}%`)
            .join(" · ")}
        </span>
      )}
    </div>
  );
}

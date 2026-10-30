/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { KeyboardEvent } from "react";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { cn } from "@plane/utils";

export type SegmentedProgressSegment = {
  id: string | number;
  /** Shown in the segment tooltip and used as the accessible name of a clickable segment. */
  name: string;
  /** Raw amount; each segment's width is its share of the sum of all values. */
  value: number;
  /** Any CSS colour, e.g. a state group colour. */
  color: string;
};

export type SegmentedProgressSize = "sm" | "md" | "lg" | "xl";

export type SegmentedProgressProps<T extends SegmentedProgressSegment = SegmentedProgressSegment> = {
  data: T[];
  /** @default "sm" */
  size?: SegmentedProgressSize;
  /** Hide the per-segment tooltip. */
  hideTooltip?: boolean;
  /** Append `%` to the tooltip value, for data that is already a percentage. */
  isPercentage?: boolean;
  /** Makes every segment a keyboard-reachable button. */
  onSegmentClick?: (segment: T) => void;
  /** Accessible name for the whole bar. */
  "aria-label"?: string;
  className?: string;
  segmentClassName?: string;
};

const SIZE_CLASS: Record<SegmentedProgressSize, string> = {
  sm: "h-2",
  md: "h-3",
  lg: "h-3.5",
  xl: "h-3.5",
};

/**
 * A stacked progress bar with one coloured segment per item (e.g. per state group), sized by its
 * share of the total. Propel's `LinearProgress` only draws a single value, hence this block.
 */
export function SegmentedProgress<T extends SegmentedProgressSegment = SegmentedProgressSegment>(
  props: SegmentedProgressProps<T>
) {
  const {
    data,
    size = "sm",
    hideTooltip = false,
    isPercentage = false,
    onSegmentClick,
    "aria-label": ariaLabel,
    className,
    segmentClassName,
  } = props;

  const total = data.reduce((sum, segment) => sum + Math.max(segment.value, 0), 0);
  // Empty segments are dropped so they don't leave a stray gap in the track.
  const visibleSegments = total > 0 ? data.filter((segment) => segment.value > 0) : [];

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, segment: T) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSegmentClick?.(segment);
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("flex w-full gap-[1.5px] rounded-xs bg-surface-2 p-[2px]", SIZE_CLASS[size], className)}
    >
      {visibleSegments.map((segment) => {
        const segmentNode = (
          <div
            key={segment.id}
            style={{ width: `${(segment.value / total) * 100}%`, backgroundColor: segment.color }}
            className={cn(
              "h-full first:rounded-l-xs last:rounded-r-xs",
              onSegmentClick &&
                "cursor-pointer transition-opacity outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-accent-strong",
              segmentClassName
            )}
            {...(onSegmentClick && {
              role: "button",
              tabIndex: 0,
              "aria-label": segment.name,
              onClick: () => onSegmentClick(segment),
              onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => handleKeyDown(event, segment),
            })}
          />
        );

        if (hideTooltip) return segmentNode;
        return (
          <Tooltip key={segment.id} label={`${segment.name} ${Math.round(segment.value)}${isPercentage ? "%" : ""}`}>
            {segmentNode}
          </Tooltip>
        );
      })}
    </div>
  );
}

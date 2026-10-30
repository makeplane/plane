/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { cn } from "@plane/utils";

export type ProgressRingProps = {
  /** Completion from 0 to 100; out-of-range values are clamped. */
  value: number;
  /** Width and height of the ring in px. @default 40 */
  size?: number;
  /** Thickness of the track and arc in px. @default 6 */
  strokeWidth?: number;
  /** A Propel `stroke-*` utility for the arc. @default "stroke-success-secondary" */
  arcClassName?: string;
  /** Centred content, e.g. the percentage or a check mark. */
  children?: ReactNode;
  /** Accessible name; without it the ring is decorative and hidden from assistive tech. */
  "aria-label"?: string;
  className?: string;
};

/**
 * A circular progress ring with a centred slot. Propel's `CircularProgress` has fixed sizes and no
 * centre content, so list rows that show "42%" inside the ring use this instead.
 */
export function ProgressRing(props: ProgressRingProps) {
  const {
    value,
    size = 40,
    strokeWidth = 6,
    arcClassName = "stroke-success-secondary",
    children,
    "aria-label": ariaLabel,
    className,
  } = props;

  const progress = Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : 0;
  const center = size / 2;
  const radius = Math.max((size - strokeWidth) / 2, 0);
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      {...(ariaLabel
        ? {
            role: "progressbar",
            "aria-label": ariaLabel,
            "aria-valuemin": 0,
            "aria-valuemax": 100,
            "aria-valuenow": Math.round(progress),
          }
        : {})}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-(--border-color-strong)"
        />
        {/* At 0% the round cap would still paint a dot, so the arc is left out. */}
        {progress > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress / 100)}
            className={cn("fill-none", arcClassName)}
          />
        )}
      </svg>
      {children !== undefined && <span className="absolute inset-0 flex items-center justify-center">{children}</span>}
    </div>
  );
}

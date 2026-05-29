import * as React from "react";

import type { ISvgIcons } from "../type";
import { DashedCircle } from "./dashed-circle";
import { ProgressCircle } from "./progress-circle";

// StateIcon component implementation
export function StartedGroupIcon({
  width = "20",
  height = "20",
  className,
  color = "#F59E0B",
  percentage = 100,
}: ISvgIcons) {
  // Ensure percentage is between 0 and 100
  const normalized =
    typeof percentage === "number"
      ? percentage <= 1
        ? percentage * 100 // treat 0-1 as fraction
        : percentage // already 0-100
      : 100; // fallback
  const validPercentage = Math.max(0, Math.min(100, normalized));

  // SVG parameters
  const viewBoxSize = 16;
  const center = viewBoxSize / 2;
  const radius = 6;
  const strokeWidth = 1.5;

  // Calculate the circumference of the circle
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - validPercentage / 100);
  const dashOffsetSmall = circumference * (1 - 100 / 100);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className={className}>
      {/* Dashed background circle with segments that disappear with progress */}
      <DashedCircle center={center} radius={radius} color={color} percentage={validPercentage} />

      {/* render smaller circle in the middle */}
      <circle
        cx={6}
        cy={6}
        r={3}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
        transform={`rotate(-90 8 6)`}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffsetSmall}
        stroke={color}
      />

      {/* Solid progress circle */}
      <ProgressCircle
        center={center}
        radius={radius}
        color={color}
        strokeWidth={strokeWidth}
        circumference={circumference}
        dashOffset={dashOffset}
      />
    </svg>
  );
}

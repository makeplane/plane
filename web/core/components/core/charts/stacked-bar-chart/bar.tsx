/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
// plane imports
import { TStackChartData } from "@plane/types";
import { cn } from "@plane/utils";

// Helper to calculate percentage
const calculatePercentage = <K extends string, T extends string>(
  data: TStackChartData<K, T>,
  stackKeys: T[],
  currentKey: T
): number => {
  const total = stackKeys.reduce((sum, key) => sum + data[key], 0);
  return total === 0 ? 0 : Math.round((data[currentKey] / total) * 100);
};

export const CustomStackBar = React.memo<any>((props: any) => {
  const { fill, x, y, width, height, dataKey, stackKeys, payload, textClassName, showPercentage } = props;
  // Calculate text position
  const MIN_BAR_HEIGHT_FOR_INTERNAL = 14; // Minimum height needed to show text inside
  const TEXT_PADDING = Math.min(6, Math.abs(MIN_BAR_HEIGHT_FOR_INTERNAL - height / 2));
  const textY = y + height - TEXT_PADDING; // Position inside bar if tall enough
  // derived values
  const RADIUS = 2;
  const currentBarPercentage = calculatePercentage(payload, stackKeys, dataKey);

  if (!height) return null;
  return (
    <g>
      <path
        d={`
          M${x + RADIUS},${y + height}
          L${x + RADIUS},${y}
          Q${x},${y} ${x},${y + RADIUS}
          L${x},${y + height - RADIUS}
          Q${x},${y + height} ${x + RADIUS},${y + height}
          L${x + width - RADIUS},${y + height}
          Q${x + width},${y + height} ${x + width},${y + height - RADIUS}
          L${x + width},${y + RADIUS}
          Q${x + width},${y} ${x + width - RADIUS},${y}
          L${x + RADIUS},${y}
        `}
        className={cn("transition-colors duration-200", fill)}
        fill="currentColor"
      />
      {showPercentage &&
        height >= MIN_BAR_HEIGHT_FOR_INTERNAL &&
        currentBarPercentage !== undefined &&
        !Number.isNaN(currentBarPercentage) && (
          <text
            x={x + width / 2}
            y={textY}
            textAnchor="middle"
            className={cn("text-xs font-medium", textClassName)}
            fill="currentColor"
          >
            {currentBarPercentage}%
          </text>
        )}
    </g>
  );
});
CustomStackBar.displayName = "CustomStackBar";

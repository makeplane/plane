/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
// plane imports
import { TChartData } from "@plane/types";
import { cn } from "@plane/utils";

// Helper to calculate percentage
const calculatePercentage = <K extends string, T extends string>(
  data: TChartData<K, T>,
  stackKeys: T[],
  currentKey: T
): number => {
  const total = stackKeys.reduce((sum, key) => sum + data[key], 0);
  return total === 0 ? 0 : Math.round((data[currentKey] / total) * 100);
};

const MIN_BAR_HEIGHT_FOR_INTERNAL_TEXT = 14; // Minimum height needed to show text inside
const BAR_TOP_BORDER_RADIUS = 4; // Border radius for each bar
const BAR_BOTTOM_BORDER_RADIUS = 4; // Border radius for each bar

export const CustomBar = React.memo((props: any) => {
  const {
    opacity,
    fill,
    x,
    y,
    width,
    height,
    dataKey,
    stackKeys,
    payload,
    textClassName,
    showPercentage,
    showTopBorderRadius,
    showBottomBorderRadius,
  } = props;
  // Calculate text position
  const TEXT_PADDING_Y = Math.min(6, Math.abs(MIN_BAR_HEIGHT_FOR_INTERNAL_TEXT - height / 2));
  const textY = y + height - TEXT_PADDING_Y; // Position inside bar if tall enough
  // derived values
  const currentBarPercentage = calculatePercentage(payload, stackKeys, dataKey);
  const showText =
    // from props
    showPercentage &&
    // height of the bar is greater than or equal to the minimum height required to show the text
    height >= MIN_BAR_HEIGHT_FOR_INTERNAL_TEXT &&
    // bar percentage text has some value
    currentBarPercentage !== undefined &&
    // bar percentage is a number
    !Number.isNaN(currentBarPercentage);

  const topBorderRadius = showTopBorderRadius ? BAR_TOP_BORDER_RADIUS : 0;
  const bottomBorderRadius = showBottomBorderRadius ? BAR_BOTTOM_BORDER_RADIUS : 0;

  if (!height) return null;

  return (
    <g>
      <path
        d={`
        M${x},${y + topBorderRadius}
        Q${x},${y} ${x + topBorderRadius},${y}
        L${x + width - topBorderRadius},${y}
        Q${x + width},${y} ${x + width},${y + topBorderRadius}
        L${x + width},${y + height - bottomBorderRadius}
        Q${x + width},${y + height} ${x + width - bottomBorderRadius},${y + height}
        L${x + bottomBorderRadius},${y + height}
        Q${x},${y + height} ${x},${y + height - bottomBorderRadius}
        Z
      `}
        className="transition-opacity duration-200"
        fill={fill}
        opacity={opacity}
      />
      {showText && (
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
CustomBar.displayName = "CustomBar";

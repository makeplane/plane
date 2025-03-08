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

  let pathData;
  if (showTopBorderRadius && showBottomBorderRadius) {
    // Both top and bottom rounded
    pathData = `
        M${x},${y + BAR_TOP_BORDER_RADIUS}
        Q${x},${y} ${x + BAR_TOP_BORDER_RADIUS},${y}
        L${x + width - BAR_TOP_BORDER_RADIUS},${y}
        Q${x + width},${y} ${x + width},${y + BAR_TOP_BORDER_RADIUS}
        L${x + width},${y + height - BAR_BOTTOM_BORDER_RADIUS}
        Q${x + width},${y + height} ${x + width - BAR_BOTTOM_BORDER_RADIUS},${y + height}
        L${x + BAR_BOTTOM_BORDER_RADIUS},${y + height}
        Q${x},${y + height} ${x},${y + height - BAR_BOTTOM_BORDER_RADIUS}
        Z
      `;
  } else if (showTopBorderRadius) {
    // Only top rounded
    pathData = `
        M${x},${y + BAR_TOP_BORDER_RADIUS}
        Q${x},${y} ${x + BAR_TOP_BORDER_RADIUS},${y}
        L${x + width - BAR_TOP_BORDER_RADIUS},${y}
        Q${x + width},${y} ${x + width},${y + BAR_TOP_BORDER_RADIUS}
        L${x + width},${y + height}
        L${x},${y + height}
        Z
      `;
  } else if (showBottomBorderRadius) {
    // Only bottom rounded
    pathData = `
        M${x},${y}
        L${x + width},${y}
        L${x + width},${y + height - BAR_BOTTOM_BORDER_RADIUS}
        Q${x + width},${y + height} ${x + width - BAR_BOTTOM_BORDER_RADIUS},${y + height}
        L${x + BAR_BOTTOM_BORDER_RADIUS},${y + height}
        Q${x},${y + height} ${x},${y + height - BAR_BOTTOM_BORDER_RADIUS}
        Z
      `;
  } else {
    // No rounded corners
    pathData = `
        M${x},${y}
        L${x + width},${y}
        L${x + width},${y + height}
        L${x},${y + height}
        Z
      `;
  }

  if (!height) return null;

  return (
    <g>
      <path d={pathData} className="transition-colors duration-200" fill={fill} />
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

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
// plane imports
import { TBarChartShapeVariant, TBarItem, TChartData } from "@plane/types";
import { cn } from "@plane/utils";

// Constants
const MIN_BAR_HEIGHT_FOR_INTERNAL_TEXT = 14; // Minimum height required to show text inside bar
const BAR_TOP_BORDER_RADIUS = 4; // Border radius for the top of bars
const BAR_BOTTOM_BORDER_RADIUS = 4; // Border radius for the bottom of bars
const DEFAULT_LOLLIPOP_LINE_WIDTH = 2; // Width of lollipop stick
const DEFAULT_LOLLIPOP_CIRCLE_RADIUS = 8; // Radius of lollipop circle

// Types
interface TShapeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  dataKey: string;
  payload: any;
  opacity?: number;
}

interface TBarProps extends TShapeProps {
  fill: string | ((payload: any) => string);
  stackKeys: string[];
  textClassName?: string;
  showPercentage?: boolean;
  showTopBorderRadius?: boolean;
  showBottomBorderRadius?: boolean;
  dotted?: boolean;
}

// Helper Functions
const calculatePercentage = <K extends string, T extends string>(
  data: TChartData<K, T>,
  stackKeys: T[],
  currentKey: T
): number => {
  const total = stackKeys.reduce((sum, key) => sum + data[key], 0);
  return total === 0 ? 0 : Math.round((data[currentKey] / total) * 100);
};

const getBarPath = (x: number, y: number, width: number, height: number, topRadius: number, bottomRadius: number) => `
  M${x},${y + topRadius}
  Q${x},${y} ${x + topRadius},${y}
  L${x + width - topRadius},${y}
  Q${x + width},${y} ${x + width},${y + topRadius}
  L${x + width},${y + height - bottomRadius}
  Q${x + width},${y + height} ${x + width - bottomRadius},${y + height}
  L${x + bottomRadius},${y + height}
  Q${x},${y + height} ${x},${y + height - bottomRadius}
  Z
`;

const PercentageText = ({
  x,
  y,
  percentage,
  className,
}: {
  x: number;
  y: number;
  percentage: number;
  className?: string;
}) => (
  <text x={x} y={y} textAnchor="middle" className={cn("text-xs font-medium", className)} fill="currentColor">
    {percentage}%
  </text>
);

// Base Components
const CustomBar = React.memo((props: TBarProps) => {
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

  if (!height) return null;

  const currentBarPercentage = calculatePercentage(payload, stackKeys, dataKey);
  const TEXT_PADDING_Y = Math.min(6, Math.abs(MIN_BAR_HEIGHT_FOR_INTERNAL_TEXT - height / 2));
  const textY = y + height - TEXT_PADDING_Y;

  const showText =
    showPercentage &&
    height >= MIN_BAR_HEIGHT_FOR_INTERNAL_TEXT &&
    currentBarPercentage !== undefined &&
    !Number.isNaN(currentBarPercentage);

  const topBorderRadius = showTopBorderRadius ? BAR_TOP_BORDER_RADIUS : 0;
  const bottomBorderRadius = showBottomBorderRadius ? BAR_BOTTOM_BORDER_RADIUS : 0;

  return (
    <g>
      <path
        d={getBarPath(x, y, width, height, topBorderRadius, bottomBorderRadius)}
        className="transition-opacity duration-200"
        fill={typeof fill === "function" ? fill(payload) : fill}
        opacity={opacity}
      />
      {showText && (
        <PercentageText x={x + width / 2} y={textY} percentage={currentBarPercentage} className={textClassName} />
      )}
    </g>
  );
});

const CustomBarLollipop = React.memo((props: TBarProps) => {
  const { fill, x, y, width, height, dataKey, stackKeys, payload, textClassName, showPercentage, dotted } = props;

  const currentBarPercentage = calculatePercentage(payload, stackKeys, dataKey);

  return (
    <g>
      <line
        x1={x + width / 2}
        y1={y + height}
        x2={x + width / 2}
        y2={y}
        stroke={typeof fill === "function" ? fill(payload) : fill}
        strokeWidth={DEFAULT_LOLLIPOP_LINE_WIDTH}
        strokeLinecap="round"
        strokeDasharray={dotted ? "4 4" : "0"}
      />
      <circle
        cx={x + width / 2}
        cy={y}
        r={DEFAULT_LOLLIPOP_CIRCLE_RADIUS}
        fill={typeof fill === "function" ? fill(payload) : fill}
        stroke="none"
      />
      {showPercentage && (
        <PercentageText x={x + width / 2} y={y} percentage={currentBarPercentage} className={textClassName} />
      )}
    </g>
  );
});

// Shape Variants
/**
 * Factory function to create shape variants with consistent props
 * @param Component - The base component to render
 * @param factoryProps - Additional props to pass to the component
 * @returns A function that creates the shape with proper props
 */
const createShapeVariant =
  (Component: React.ComponentType<TBarProps>, factoryProps?: Partial<TBarProps>) =>
  (shapeProps: TShapeProps, bar: TBarItem<string>, stackKeys: string[]): JSX.Element => {
    const showTopBorderRadius = bar.showTopBorderRadius?.(shapeProps.dataKey, shapeProps.payload);
    const showBottomBorderRadius = bar.showBottomBorderRadius?.(shapeProps.dataKey, shapeProps.payload);

    return (
      <Component
        {...shapeProps}
        fill={typeof bar.fill === "function" ? bar.fill(shapeProps.payload) : bar.fill}
        stackKeys={stackKeys}
        textClassName={bar.textClassName}
        showPercentage={bar.showPercentage}
        showTopBorderRadius={!!showTopBorderRadius}
        showBottomBorderRadius={!!showBottomBorderRadius}
        {...factoryProps}
      />
    );
  };

export const barShapeVariants: Record<
  TBarChartShapeVariant,
  (props: TShapeProps, bar: TBarItem<string>, stackKeys: string[]) => JSX.Element
> = {
  bar: createShapeVariant(CustomBar), // Standard bar with rounded corners
  lollipop: createShapeVariant(CustomBarLollipop), // Line with circle at top
  "lollipop-dotted": createShapeVariant(CustomBarLollipop, { dotted: true }), // Dotted line lollipop variant
};

// Display names
CustomBar.displayName = "CustomBar";
CustomBarLollipop.displayName = "CustomBarLollipop";

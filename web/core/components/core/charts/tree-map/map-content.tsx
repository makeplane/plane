/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
// plane imports
import { Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// constants
const AVG_WIDTH_RATIO = 0.7;

const isTruncateRequired = (text: string, maxWidth: number, fontSize: number) => {
  // Approximate width per character (this is an estimation)
  const avgCharWidth = fontSize * AVG_WIDTH_RATIO;
  const maxChars = Math.floor(maxWidth / avgCharWidth);

  return text.length > maxChars;
};

const truncateText = (text: string, maxWidth: number, fontSize: number) => {
  // Approximate width per character (this is an estimation)
  const avgCharWidth = fontSize * AVG_WIDTH_RATIO;
  const maxChars = Math.floor(maxWidth / avgCharWidth);
  if (text.length > maxChars) {
    return text.slice(0, maxChars - 2) + "...";
  }
  return text;
};

export const CustomTreeMapContent = ({
  x,
  y,
  width,
  height,
  name,
  value,
  label,
  fillColor,
  fillClassName,
  textClassName,
  icon,
}: any) => {
  const RADIUS = 10;
  const PADDING = 5;
  // Apply padding to dimensions
  const pX = x + PADDING;
  const pY = y + PADDING;
  const pWidth = width - PADDING * 2;
  const pHeight = height - PADDING * 2;
  // Text padding from the left edge
  const TEXT_PADDING_LEFT = 12;
  const TEXT_PADDING_RIGHT = 12;
  // Icon size and spacing
  const ICON_SIZE = 16;
  const ICON_TEXT_GAP = 6;
  // Available width for the text
  const iconSpace = icon ? ICON_SIZE + ICON_TEXT_GAP : 0;
  const availableWidth = pWidth - TEXT_PADDING_LEFT - TEXT_PADDING_RIGHT - iconSpace;
  // Truncate text based on available width
  // 12.6px for text-sm
  const isTextTruncated = typeof name === "string" ? isTruncateRequired(name, availableWidth, 12.6) : name;
  const truncatedName = typeof name === "string" ? truncateText(name, availableWidth, 12.6) : name;

  if (!name) return; // To remove the total count
  return (
    <g>
      <path
        d={`
          M${pX + RADIUS},${pY}
          L${pX + pWidth - RADIUS},${pY}
          Q${pX + pWidth},${pY} ${pX + pWidth},${pY + RADIUS}
          L${pX + pWidth},${pY + pHeight - RADIUS}
          Q${pX + pWidth},${pY + pHeight} ${pX + pWidth - RADIUS},${pY + pHeight}
          L${pX + RADIUS},${pY + pHeight}
          Q${pX},${pY + pHeight} ${pX},${pY + pHeight - RADIUS}
          L${pX},${pY + RADIUS}
          Q${pX},${pY} ${pX + RADIUS},${pY}
        `}
        className={cn("transition-colors duration-200 hover:opacity-90 cursor-pointer", fillClassName)}
        fill={fillColor ?? "currentColor"}
      />
      <Tooltip tooltipContent={name} className="outline-none" disabled={!isTextTruncated}>
        <g>
          {icon && (
            <foreignObject
              x={pX + TEXT_PADDING_LEFT}
              y={pY + TEXT_PADDING_LEFT}
              width={ICON_SIZE}
              height={ICON_SIZE}
              className={textClassName || "text-custom-text-300"}
            >
              {React.cloneElement(icon, {
                className: cn("size-4", icon?.props?.className),
                "aria-hidden": true,
              })}
            </foreignObject>
          )}
          <text
            x={pX + TEXT_PADDING_LEFT + (icon ? ICON_SIZE + ICON_TEXT_GAP : 0)}
            y={pY + TEXT_PADDING_LEFT * 2}
            textAnchor="start"
            className={cn(
              "text-sm font-light truncate max-w-[90%] tracking-wider",
              textClassName || "text-custom-text-300"
            )}
            fill="currentColor"
          >
            {truncatedName}
          </text>
        </g>
      </Tooltip>
      <text
        x={pX + TEXT_PADDING_LEFT}
        y={pY + pHeight - TEXT_PADDING_LEFT}
        textAnchor="start"
        className={cn("text-xs font-light tracking-wider", textClassName || "text-custom-text-300")}
        fill="currentColor"
      >
        {value?.toLocaleString()}
        {label && ` ${label}`}
      </text>
    </g>
  );
};

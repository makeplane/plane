import React, { useMemo } from "react";
// plane imports
import type { TBottomSectionConfig, TContentVisibility, TTopSectionConfig } from "@plane/types";
import { cn } from "../../utils/classname";

const LAYOUT = {
  PADDING: 2,
  RADIUS: 6,
  TEXT: {
    PADDING_LEFT: 8,
    PADDING_RIGHT: 8,
    VERTICAL_OFFSET: 20,
    ELLIPSIS_OFFSET: -4,
    FONT_SIZES: {
      SM: 12.6,
      XS: 10.8,
    },
  },
  ICON: {
    SIZE: 16,
    GAP: 6,
  },
  MIN_DIMENSIONS: {
    HEIGHT_FOR_BOTH: 42,
    HEIGHT_FOR_TOP: 35,
    HEIGHT_FOR_DOTS: 20,
    WIDTH_FOR_ICON: 30,
    WIDTH_FOR_DOTS: 15,
  },
};

const calculateContentWidth = (text: string | number, fontSize: number): number => String(text).length * fontSize * 0.7;

const calculateTopSectionConfig = (effectiveWidth: number, name: string, hasIcon: boolean): TTopSectionConfig => {
  const iconWidth = hasIcon ? LAYOUT.ICON.SIZE + LAYOUT.ICON.GAP : 0;
  const nameWidth = calculateContentWidth(name, LAYOUT.TEXT.FONT_SIZES.SM);
  const totalPadding = LAYOUT.TEXT.PADDING_LEFT + LAYOUT.TEXT.PADDING_RIGHT;

  // First check if we can show icon
  const canShowIcon = hasIcon && effectiveWidth >= LAYOUT.MIN_DIMENSIONS.WIDTH_FOR_ICON;

  // If we can't even show icon, check if we can show dots
  if (!canShowIcon) {
    return {
      showIcon: false,
      showName: effectiveWidth >= LAYOUT.MIN_DIMENSIONS.WIDTH_FOR_DOTS,
      nameTruncated: true,
    };
  }

  // We can show icon, now check if we have space for name
  const availableWidthForName = effectiveWidth - (canShowIcon ? iconWidth : 0) - totalPadding;
  const canShowFullName = availableWidthForName >= nameWidth;

  return {
    showIcon: canShowIcon,
    showName: availableWidthForName > 0,
    nameTruncated: !canShowFullName,
  };
};

const calculateBottomSectionConfig = (
  effectiveWidth: number,
  effectiveHeight: number,
  value: number | undefined,
  label: string | undefined
): TBottomSectionConfig => {
  // If height is not enough for bottom section
  if (effectiveHeight < LAYOUT.MIN_DIMENSIONS.HEIGHT_FOR_BOTH) {
    return {
      show: false,
      showValue: false,
      showLabel: false,
      labelTruncated: false,
    };
  }

  // Calculate widths
  const totalPadding = LAYOUT.TEXT.PADDING_LEFT + LAYOUT.TEXT.PADDING_RIGHT;
  const valueWidth = value ? calculateContentWidth(value, LAYOUT.TEXT.FONT_SIZES.XS) : 0;
  const labelWidth = label ? calculateContentWidth(label, LAYOUT.TEXT.FONT_SIZES.XS) + 4 : 0; // 4px for spacing
  const availableWidth = effectiveWidth - totalPadding;

  // If we can't even show value
  if (availableWidth < Math.max(valueWidth, LAYOUT.MIN_DIMENSIONS.WIDTH_FOR_DOTS)) {
    return {
      show: true,
      showValue: false,
      showLabel: false,
      labelTruncated: false,
    };
  }

  // If we can show value but not full label
  const canShowFullLabel = availableWidth >= valueWidth + labelWidth;

  return {
    show: true,
    showValue: true,
    showLabel: true,
    labelTruncated: !canShowFullLabel,
  };
};

const calculateVisibility = (
  width: number,
  height: number,
  hasIcon: boolean,
  name: string,
  value: number | undefined,
  label: string | undefined
): TContentVisibility => {
  const effectiveWidth = width - LAYOUT.PADDING * 2;
  const effectiveHeight = height - LAYOUT.PADDING * 2;

  // If extremely small, show only dots
  if (
    effectiveHeight < LAYOUT.MIN_DIMENSIONS.HEIGHT_FOR_DOTS ||
    effectiveWidth < LAYOUT.MIN_DIMENSIONS.WIDTH_FOR_DOTS
  ) {
    return {
      top: { showIcon: false, showName: false, nameTruncated: false },
      bottom: { show: false, showValue: false, showLabel: false, labelTruncated: false },
    };
  }

  const topSection = calculateTopSectionConfig(effectiveWidth, name, hasIcon);
  const bottomSection = calculateBottomSectionConfig(effectiveWidth, effectiveHeight, value, label);

  return {
    top: topSection,
    bottom: bottomSection,
  };
};

const truncateText = (text: string | number, maxWidth: number, fontSize: number, reservedWidth: number = 0): string => {
  const availableWidth = maxWidth - reservedWidth;
  if (availableWidth <= 0) return "";

  const avgCharWidth = fontSize * 0.7;
  const maxChars = Math.floor(availableWidth / avgCharWidth);
  const stringText = String(text);

  if (maxChars <= 3) return "";
  if (stringText.length <= maxChars) return stringText;
  return `${stringText.slice(0, maxChars - 3)}...`;
};

export function CustomTreeMapContent({
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
}: any) {
  const dimensions = useMemo(() => {
    const pX = x + LAYOUT.PADDING;
    const pY = y + LAYOUT.PADDING;
    const pWidth = Math.max(0, width - LAYOUT.PADDING * 2);
    const pHeight = Math.max(0, height - LAYOUT.PADDING * 2);
    return { pX, pY, pWidth, pHeight };
  }, [x, y, width, height]);

  const visibility = useMemo(
    () => calculateVisibility(width, height, !!icon, name, value, label),
    [width, height, icon, name, value, label]
  );

  if (!name || width <= 0 || height <= 0) return null;

  const renderContent = () => {
    const { pX, pY, pWidth, pHeight } = dimensions;
    const { top, bottom } = visibility;

    const availableTextWidth = pWidth - LAYOUT.TEXT.PADDING_LEFT - LAYOUT.TEXT.PADDING_RIGHT;
    const iconSpace = top.showIcon ? LAYOUT.ICON.SIZE + LAYOUT.ICON.GAP : 0;

    return (
      <g>
        {/* Background shape */}
        <path
          d={`
            M${pX + LAYOUT.RADIUS},${pY}
            L${pX + pWidth - LAYOUT.RADIUS},${pY}
            Q${pX + pWidth},${pY} ${pX + pWidth},${pY + LAYOUT.RADIUS}
            L${pX + pWidth},${pY + pHeight - LAYOUT.RADIUS}
            Q${pX + pWidth},${pY + pHeight} ${pX + pWidth - LAYOUT.RADIUS},${pY + pHeight}
            L${pX + LAYOUT.RADIUS},${pY + pHeight}
            Q${pX},${pY + pHeight} ${pX},${pY + pHeight - LAYOUT.RADIUS}
            L${pX},${pY + LAYOUT.RADIUS}
            Q${pX},${pY} ${pX + LAYOUT.RADIUS},${pY}
          `}
          className={cn("transition-colors duration-200 hover:opacity-90", fillClassName)}
          fill={fillColor ?? "currentColor"}
        />

        {/* Top section */}
        <g>
          {top.showIcon && icon && (
            <foreignObject
              x={pX + LAYOUT.TEXT.PADDING_LEFT}
              y={pY + LAYOUT.TEXT.PADDING_LEFT}
              width={LAYOUT.ICON.SIZE}
              height={LAYOUT.ICON.SIZE}
              className={textClassName || "text-tertiary"}
            >
              {React.cloneElement(icon, {
                className: cn("size-4", icon?.props?.className),
                "aria-hidden": true,
              })}
            </foreignObject>
          )}
          {top.showName && (
            <text
              x={pX + LAYOUT.TEXT.PADDING_LEFT + iconSpace}
              y={pY + LAYOUT.TEXT.VERTICAL_OFFSET}
              textAnchor="start"
              className={cn("text-13 font-light tracking-wider select-none", textClassName || "text-tertiary")}
              fill="currentColor"
            >
              {top.nameTruncated ? truncateText(name, availableTextWidth, LAYOUT.TEXT.FONT_SIZES.SM, iconSpace) : name}
            </text>
          )}
        </g>

        {/* Bottom section */}
        {bottom.show && (
          <g>
            {bottom.showValue && value !== undefined && (
              <text
                x={pX + LAYOUT.TEXT.PADDING_LEFT}
                y={pY + pHeight - LAYOUT.TEXT.PADDING_LEFT}
                textAnchor="start"
                className={cn("text-13 font-light tracking-wider select-none", textClassName || "text-tertiary")}
                fill="currentColor"
              >
                {value.toLocaleString()}
                {bottom.showLabel && label && (
                  <tspan dx={4}>
                    {bottom.labelTruncated
                      ? truncateText(
                          label,
                          availableTextWidth - calculateContentWidth(value, LAYOUT.TEXT.FONT_SIZES.SM) - 4,
                          LAYOUT.TEXT.FONT_SIZES.SM
                        )
                      : label}
                  </tspan>
                )}
                {!bottom.showLabel && label && <tspan dx={4}>...</tspan>}
              </text>
            )}
          </g>
        )}
      </g>
    );
  };

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill="transparent" />
      {renderContent()}
    </g>
  );
}

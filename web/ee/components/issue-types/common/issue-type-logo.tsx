import React, { FC } from "react";
import { useTheme } from "next-themes";
// types
import { TLogoProps } from "@plane/types";
// ui
import { EpicIcon, LayersIcon, LUCIDE_ICONS_LIST } from "@plane/ui";
import { hexToHsl } from "@plane/utils";
// helpers
import { cn } from "@/helpers/common.helper";
import { createBackgroundColor, getIconColor } from "@/helpers/theme";

export type TIssueTypeLogoSize = "xs" | "sm" | "md" | "lg" | "xl";

type Props = {
  icon_props: TLogoProps["icon"];
  size?: TIssueTypeLogoSize;
  containerClassName?: string;
  isDefault?: boolean;
  isEpic?: boolean;
};

const iconSizeMap = {
  xs: 11,
  sm: 14,
  md: 14.5,
  lg: 18,
  xl: 24.5,
};

const containerSizeMap = {
  xs: 15.5,
  sm: 20,
  md: 21,
  lg: 25.5,
  xl: 35.5,
};

export const IssueTypeLogo: FC<Props> = (props) => {
  const { icon_props, size = "sm", containerClassName, isDefault = false, isEpic = false } = props;
  const { resolvedTheme } = useTheme();

  // derived values
  const LucideIcon = LUCIDE_ICONS_LIST.find((item) => item.name === icon_props?.name);
  const renderDefaultIcon = isDefault && (!icon_props?.name || !icon_props?.background_color);

  // if no value, return empty fragment
  if (!icon_props?.name && !isDefault && !isEpic) return <></>;

  const hsl = icon_props?.background_color ? hexToHsl(icon_props?.background_color) : null;
  const iconColor = hsl ? getIconColor(hsl) : "transparent";
  const backgroundColor = hsl ? createBackgroundColor(hsl, resolvedTheme as "light" | "dark") : "transparent";

  return (
    <>
      <span
        style={{
          height: containerSizeMap[size],
          width: containerSizeMap[size],
          backgroundColor: backgroundColor,
        }}
        className={cn(
          "flex-shrink-0 grid place-items-center rounded bg-custom-background-80",
          {
            "bg-transparent": isEpic,
          },
          containerClassName
        )}
      >
        {isEpic ? (
          <EpicIcon
            width={containerSizeMap[size]}
            height={containerSizeMap[size]}
            className="text-custom-text-300 group-hover/kanban-block:text-custom-text-200"
            color={iconColor}
          />
        ) : renderDefaultIcon ? (
          <LayersIcon
            width={iconSizeMap[size]}
            height={iconSizeMap[size]}
            style={{
              color: iconColor ?? "#ffffff", // fallback color
            }}
          />
        ) : (
          LucideIcon && (
            <LucideIcon.element
              style={{
                height: iconSizeMap[size],
                width: iconSizeMap[size],
                color: iconColor ?? "#ffffff", // fallback color
              }}
            />
          )
        )}
      </span>
    </>
  );
};

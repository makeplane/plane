import React, { FC } from "react";
// types
import { TLogoProps } from "@plane/types";
// ui
import { LayersIcon, LUCIDE_ICONS_LIST } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";

export type TIssueTypeLogoSize = "sm" | "md" | "lg" | "xl";

type Props = {
  icon_props: TLogoProps["icon"];
  size?: TIssueTypeLogoSize;
  containerClassName?: string;
  isDefault?: boolean;
};

const iconSizeMap = {
  sm: 12.5,
  md: 14.5,
  lg: 18,
  xl: 25,
};

const containerSizeMap = {
  sm: 18,
  md: 21,
  lg: 25.5,
  xl: 35.5,
};

export const IssueTypeLogo: FC<Props> = (props) => {
  const { icon_props, size = "sm", containerClassName, isDefault = false } = props;
  // derived values
  const LucideIcon = LUCIDE_ICONS_LIST.find((item) => item.name === icon_props?.name);
  const renderDefaultIcon = isDefault && (!icon_props?.name || !icon_props?.background_color);

  // if no value, return empty fragment
  if (!icon_props?.name && !isDefault) return <></>;

  return (
    <>
      <span
        style={{
          height: containerSizeMap[size],
          width: containerSizeMap[size],
          backgroundColor: icon_props?.background_color,
        }}
        className={cn("flex-shrink-0 grid place-items-center rounded bg-custom-background-80", containerClassName)} // fallback background color
      >
        {renderDefaultIcon ? (
          <LayersIcon
            width={iconSizeMap[size]}
            height={iconSizeMap[size]}
            style={{
              color: icon_props?.color ?? "#ffffff", // fallback color
            }}
          />
        ) : (
          LucideIcon && (
            <LucideIcon.element
              style={{
                height: iconSizeMap[size],
                width: iconSizeMap[size],
                color: icon_props?.color ?? "#ffffff", // fallback color
              }}
            />
          )
        )}
      </span>
    </>
  );
};

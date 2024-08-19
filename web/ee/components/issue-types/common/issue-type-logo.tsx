import React, { FC } from "react";
// types
import { TLogoProps } from "@plane/types";
// ui
import { LayersIcon, LUCIDE_ICONS_LIST } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";

type Props = {
  icon_props: TLogoProps["icon"];
  size?: number;
  containerSize?: number;
  containerClassName?: string;
  isDefault?: boolean;
};

export const IssueTypeLogo: FC<Props> = (props) => {
  const { icon_props, size = 11, containerSize = 18, containerClassName, isDefault = false } = props;
  // derived values
  const LucideIcon = LUCIDE_ICONS_LIST.find((item) => item.name === icon_props?.name);

  // if no value, return empty fragment
  if (!icon_props?.name && !isDefault) return <></>;

  return (
    <>
      <span
        style={{
          height: containerSize,
          width: containerSize,
          backgroundColor: icon_props?.background_color,
        }}
        className={cn("flex-shrink-0 grid place-items-center rounded bg-custom-background-80", containerClassName)} // fallback background color
      >
        {isDefault ? (
          <LayersIcon
            width={size}
            height={size}
            style={{
              color: icon_props?.color ?? "#ffffff", // fallback color
            }}
          />
        ) : (
          LucideIcon && (
            <LucideIcon.element
              style={{
                height: size,
                width: size,
                color: icon_props?.color ?? "#ffffff", // fallback color
              }}
            />
          )
        )}
      </span>
    </>
  );
};

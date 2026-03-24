/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// plane imports
import { LUCIDE_ICONS_LIST } from "@plane/propel/emoji-icon-picker";
import { EpicIcon, LayersIcon } from "@plane/propel/icons";
import type { TLogoProps } from "@plane/types";
import { cn, generateIconColors, truncateProjectIdentifierForDisplay } from "@plane/utils";

export type TIssueTypeLogoSize = "xs" | "sm" | "md" | "lg" | "xl";

type Props = {
  icon_props: TLogoProps["icon"];
  size?: TIssueTypeLogoSize;
  containerClassName?: string;
  isDefault?: boolean;
  isEpic?: boolean;
  showWorkItemTypeName?: boolean;
  issueTypeName?: string;
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

export function IssueTypeLogo(props: Props) {
  const {
    icon_props,
    size = "sm",
    containerClassName,
    isDefault = false,
    isEpic = false,
    showWorkItemTypeName = false,
    issueTypeName = "",
  } = props;

  // derived values
  const LucideIcon = LUCIDE_ICONS_LIST.find(function LucideIcon(item) {
    return item.name === icon_props?.name;
  });
  const renderDefaultIcon = isDefault && (!icon_props?.name || !icon_props?.background_color);

  // if no value, return empty fragment
  if (!icon_props?.name && !isDefault && !isEpic) return <></>;

  const { foreground, background } = generateIconColors(icon_props?.background_color ?? "#000000");

  return (
    <>
      <span
        style={{
          height: containerSizeMap[size],
          minWidth: containerSizeMap[size],
          backgroundColor: isEpic ? "transparent" : background,
        }}
        className={cn(
          "shrink-0 flex items-center justify-center gap-2 rounded-sm bg-layer-1",
          {
            "bg-transparent": isEpic,
            "px-2": !isEpic && showWorkItemTypeName,
          },

          containerClassName
        )}
      >
        {isEpic ? (
          <EpicIcon
            width={containerSizeMap[size]}
            height={containerSizeMap[size]}
            className="text-tertiary group-hover/kanban-block:text-secondary"
            color={foreground}
          />
        ) : renderDefaultIcon ? (
          <LayersIcon
            width={iconSizeMap[size]}
            height={iconSizeMap[size]}
            style={{
              color: foreground ?? "#ffffff", // fallback color
            }}
          />
        ) : (
          LucideIcon && (
            <LucideIcon.element
              style={{
                height: iconSizeMap[size],
                width: iconSizeMap[size],
                color: foreground ?? "#ffffff", // fallback color
              }}
            />
          )
        )}
        {!isEpic && showWorkItemTypeName && (
          <span className="text-body-xs-medium" style={{ color: foreground }}>
            {truncateProjectIdentifierForDisplay(issueTypeName)}
          </span>
        )}
      </span>
    </>
  );
}

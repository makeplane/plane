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

import { LUCIDE_ICONS_LIST } from "@plane/propel/emoji-icon-picker";
import { LayersIcon } from "@plane/propel/icons";
import type { TLogoProps } from "@plane/types";
import { cn, generateIconColors } from "@plane/utils";

type TWorkItemTypeLogoSize = "xs" | "sm";

type WorkItemTypeLogoProps = {
  logoProps: TLogoProps | null | undefined;
  name?: string;
  size?: TWorkItemTypeLogoSize;
  showName?: boolean;
  className?: string;
};

const iconSizeMap = {
  xs: 11,
  sm: 14,
};

const containerSizeMap = {
  xs: 15.5,
  sm: 20,
};

const textClassNameMap = {
  xs: "text-[10px]",
  sm: "text-11",
};

// TODO-@plane/blocks WorkItemTypeLogo
export function WorkItemTypeLogo({ logoProps, name, size = "sm", showName = false, className }: WorkItemTypeLogoProps) {
  const iconProps = logoProps?.icon;
  const LucideIcon = LUCIDE_ICONS_LIST.find((item) => item.name === iconProps?.name);
  const renderDefaultIcon = !iconProps?.name || !iconProps?.background_color;
  const { foreground, background } = generateIconColors(iconProps?.background_color ?? "#000000");

  return (
    <span
      style={{
        minHeight: containerSizeMap[size],
        minWidth: showName ? undefined : containerSizeMap[size],
        backgroundColor: background,
        color: foreground ?? "#ffffff",
      }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-sm bg-layer-1",
        showName && "gap-1.5 px-1.5",
        className
      )}
    >
      {renderDefaultIcon ? (
        <LayersIcon width={iconSizeMap[size]} height={iconSizeMap[size]} style={{ color: foreground ?? "#ffffff" }} />
      ) : (
        LucideIcon && (
          <LucideIcon.element
            style={{
              height: iconSizeMap[size],
              width: iconSizeMap[size],
              color: foreground ?? "#ffffff",
            }}
          />
        )
      )}
      {showName && name && (
        <span
          className={cn("truncate font-medium leading-none", textClassNameMap[size])}
          style={{ color: foreground ?? "#ffffff" }}
        >
          {name}
        </span>
      )}
    </span>
  );
}

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

import { AtRiskIcon, OffTrackIcon, OnTrackIcon } from "@plane/propel/icons";
import { EUpdateStatus } from "@plane/types";
import { capitalizeFirstLetter, cn, generateIconColors } from "@plane/utils";

export const StatusOptions = {
  [EUpdateStatus.ON_TRACK]: {
    icon: OnTrackIcon,
    color: "#1FAD40",
  },

  [EUpdateStatus.AT_RISK]: {
    icon: AtRiskIcon,
    color: "#CC7700",
  },
  [EUpdateStatus.OFF_TRACK]: {
    icon: OffTrackIcon,
    color: "#CC0000",
  },
};

export type TUpdateStatusIcons = {
  statusType?: EUpdateStatus;
  showBackground?: boolean;
  size?: "xs" | "sm" | "md";
  showText?: boolean;
  className?: string;
};

const sizes = {
  xs: {
    icon: 12,
    container: "w-4 h-4",
  },
  sm: {
    icon: 16,
    container: "w-6 h-6",
  },
  md: {
    icon: 20,
    container: "w-8 h-8",
  },
};

export function UpdateStatusIcons({
  statusType,
  showBackground = true,
  size = "sm",
  showText = false,
  className = "",
}: TUpdateStatusIcons) {
  const status = statusType ? StatusOptions[statusType] : null;
  const color = status?.color ? generateIconColors(status?.color) : null;
  const iconColor = color ? color.foreground : "transparent";
  const backgroundColor = color ? color.background : "transparent";

  if (!showBackground && !status) return null;

  return (
    <>
      {showBackground ? (
        <div
          style={{
            backgroundColor: backgroundColor,
          }}
          className={cn(
            sizes[size].container,
            "flex-shrink-0 place-items-center rounded-full bg-layer-1 flex gap-1 p-1 justify-center",
            className,
            {
              "border border-dashed border-subtle-1": !status,
              "px-2 w-auto": showText,
            }
          )}
        >
          {status && (
            <status.icon
              width={sizes[size].icon}
              height={sizes[size].icon}
              style={{
                color: iconColor ?? "#ffffff", // fallback color
              }}
              className="flex-shrink-0"
            />
          )}
          {showText && (
            <span className="text-11 font-semibold" style={{ color: iconColor }}>
              {statusType && capitalizeFirstLetter(statusType.replaceAll("-", " ").toLowerCase())}
            </span>
          )}
        </div>
      ) : (
        status && (
          <status.icon
            width={sizes[size].icon}
            height={sizes[size].icon}
            style={{
              color: iconColor ?? "#ffffff", // fallback color
            }}
          />
        )
      )}
    </>
  );
}

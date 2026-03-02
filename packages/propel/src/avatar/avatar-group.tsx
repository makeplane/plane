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

import React from "react";
import { Tooltip } from "../tooltip";
import { cn } from "../utils/classname";
import type { TAvatarSize } from "./avatar";
import { getSizeInfo, isAValidNumber } from "./avatar";

type Props = {
  children: React.ReactNode;
  max?: number;
  showTooltip?: boolean;
  size?: TAvatarSize;
};

export function AvatarGroup(props: Props) {
  const { children, max = 2, showTooltip = true, size = "md" } = props;

  const totalAvatars = React.Children.toArray(children).length;

  const maxAvatarsToRender = totalAvatars <= max + 1 ? max + 1 : max;

  const avatars = React.Children.toArray(children).slice(0, maxAvatarsToRender);

  const avatarsWithUpdatedProps = avatars.map((avatar) => {
    const updatedProps: Partial<Props> = {
      showTooltip,
      size,
    };

    return React.cloneElement(avatar as React.ReactElement, updatedProps);
  });

  const sizeInfo = getSizeInfo(size);

  return (
    <div className={cn("flex", sizeInfo.spacing)}>
      {avatarsWithUpdatedProps.map((avatar, index) => (
        <div key={index} className="rounded-full border border-subtle-1">
          {avatar}
        </div>
      ))}
      {maxAvatarsToRender < totalAvatars && (
        <Tooltip tooltipContent={`${totalAvatars} total`} disabled={!showTooltip}>
          <div
            className={cn(
              "grid place-items-center rounded-full bg-accent-subtle text-9 text-accent-primary border border-subtle-1",
              {
                [sizeInfo.avatarSize]: !isAValidNumber(size),
              }
            )}
            style={
              isAValidNumber(size)
                ? {
                    width: `${size}px`,
                    height: `${size}px`,
                  }
                : {}
            }
          >
            +{totalAvatars - max}
          </div>
        </Tooltip>
      )}
    </div>
  );
}

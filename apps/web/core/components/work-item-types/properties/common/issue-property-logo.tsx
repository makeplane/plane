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

import type { FC } from "react";
import React from "react";
import { TriangleAlert } from "lucide-react";
// plane imports
import { LUCIDE_ICONS_LIST } from "@plane/propel/emoji-icon-picker";
import type { TLogoProps } from "@plane/types";
import { cn } from "@plane/utils";

type Props = {
  icon_props: TLogoProps["icon"];
  size?: number;
  colorClassName?: string;
};

export function IssuePropertyLogo(props: Props) {
  const { icon_props, size = 16, colorClassName = "" } = props;
  // derived values
  const LucideIcon = LUCIDE_ICONS_LIST.find((item) => item.name === icon_props?.name)?.element ?? TriangleAlert;

  // icon
  return (
    <>
      <LucideIcon
        style={{
          color: !colorClassName ? icon_props?.color : undefined,
          height: size,
          width: size,
        }}
        className={cn(colorClassName)}
      />
    </>
  );
}

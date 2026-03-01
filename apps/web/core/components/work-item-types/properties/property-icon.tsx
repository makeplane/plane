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

import type { LucideIcon } from "lucide-react";
import { CircleChevronDown, ToggleLeft, UsersRound, Hash, AlignLeft } from "lucide-react";
import type { ISvgIcons } from "@plane/propel/icons";
// plane imports
import { CalendarLayoutIcon, LinkIcon } from "@plane/propel/icons";
import type { TIssuePropertyTypeIconKey } from "@plane/types";
import { cn } from "@plane/utils";

export const CUSTOM_PROPERTY_ICON_MAP: Record<TIssuePropertyTypeIconKey, LucideIcon | React.FC<ISvgIcons>> = {
  AlignLeft: AlignLeft,
  Hash: Hash,
  CircleChevronDown: CircleChevronDown,
  ToggleLeft: ToggleLeft,
  Calendar: CalendarLayoutIcon,
  UsersRound: UsersRound,
  Link2: LinkIcon,
};

type TPropertyTypeIconProps = {
  iconKey: TIssuePropertyTypeIconKey;
  className?: string;
};

export function PropertyTypeIcon({ iconKey, className }: TPropertyTypeIconProps) {
  const Icon = CUSTOM_PROPERTY_ICON_MAP[iconKey];
  return <Icon className={cn("size-3 text-secondary", className)} />;
}

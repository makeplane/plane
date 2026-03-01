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

import type { ReactNode } from "react";
import { cn } from "@plane/utils";
import { Tooltip } from "@plane/propel/tooltip";

type TSidebarPropertyListItemProps = {
  icon: React.FC<{ className?: string }>;
  label: string;
  children: ReactNode;
  appendElement?: ReactNode;
  childrenClassName?: string;
};

export function SidebarPropertyListItem(props: TSidebarPropertyListItemProps) {
  const { icon: Icon, label, children, appendElement, childrenClassName } = props;

  return (
    <div className="flex items-start gap-2">
      <div className="flex shrink-0 items-center gap-1.5 w-30 text-body-xs-regular text-tertiary h-7.5 truncate">
        <Icon className="size-4 shrink-0" />
        <Tooltip tooltipContent={label}>
          <span className="truncate">{label}</span>
        </Tooltip>
        {appendElement}
      </div>
      <div className={cn("grow flex items-center flex-wrap gap-1 truncate", childrenClassName)}>{children}</div>
    </div>
  );
}

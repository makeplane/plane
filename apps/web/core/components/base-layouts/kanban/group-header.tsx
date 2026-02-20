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

import { cn } from "@plane/utils";
import { Maximize2, Minimize2 } from "lucide-react";
import type { IGroupHeaderProps } from "@plane/types";

const collapseIconProps = { width: 14, strokeWidth: 2 };

export function GroupHeader({ group, itemCount, isCollapsed, onToggleGroup }: IGroupHeaderProps) {
  return (
    <div
      className={cn(
        "relative flex flex-shrink-0 gap-1 py-1.5 text-13 font-medium text-secondary w-full",
        isCollapsed ? "flex-col items-center" : "flex-row items-center"
      )}
    >
      {group.icon ? (
        <div className="flex size-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-xs">
          {group.icon}
        </div>
      ) : null}

      <div
        className={cn(
          "relative flex gap-1",
          isCollapsed ? "flex-col items-center" : "w-full flex-row items-baseline overflow-hidden"
        )}
      >
        <div
          className={cn(
            "line-clamp-1 inline-block overflow-hidden truncate font-medium text-primary",
            isCollapsed && "vertical-lr max-h-[400px]"
          )}
        >
          {group.name}
        </div>
        <div className={cn("flex-shrink-0 text-13 font-medium text-tertiary", isCollapsed ? "pr-0.5" : "pl-2")}>
          {itemCount}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onToggleGroup(group.id)}
        className="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm transition-all hover:bg-layer-transparent-hover bg-layer-transparent"
        aria-label={isCollapsed ? `Expand ${group.name}` : `Collapse ${group.name}`}
        aria-expanded={!isCollapsed}
      >
        {isCollapsed ? <Maximize2 {...collapseIconProps} /> : <Minimize2 {...collapseIconProps} />}
      </button>
    </div>
  );
}

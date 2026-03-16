/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { Circle, ChevronRight } from "lucide-react";
// plane imports
import type { TIssueGroupByOptions, IGroupByColumn } from "@plane/types";
import { cn } from "@plane/utils";
// plane-web
import { WorkFlowGroupTree } from "@/plane-web/components/workflow";

interface IGroupedBoardGroupHeader {
  subGroup: IGroupByColumn;
  sub_group_by: TIssueGroupByOptions | undefined;
  count: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const GroupedBoardGroupHeader = observer(function GroupedBoardGroupHeader(props: IGroupedBoardGroupHeader) {
  const { subGroup, sub_group_by, count, isCollapsed, onToggleCollapse } = props;

  return (
    <div
      className={cn(
        "sticky top-0 z-[3]",
        "flex items-center gap-2 px-4 py-3",
        "cursor-pointer hover:bg-custom-background-90 transition-colors"
      )}
      onClick={onToggleCollapse}
    >
      <ChevronRight
        className={cn("size-4 text-tertiary transition-transform duration-200", !isCollapsed && "rotate-90")}
      />
      <div className="flex size-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-xs">
        {subGroup.icon ? subGroup.icon : <Circle width={14} strokeWidth={2} />}
      </div>
      <span className="font-medium text-primary">{subGroup.name}</span>
      <span className="text-13 text-tertiary">({count} work items)</span>
      <WorkFlowGroupTree groupBy={sub_group_by} groupId={subGroup.id} />
    </div>
  );
});

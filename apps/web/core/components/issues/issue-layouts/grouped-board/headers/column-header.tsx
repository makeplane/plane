/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { Circle } from "lucide-react";
// plane imports
import type { TIssueGroupByOptions, IGroupByColumn } from "@plane/types";
import { cn } from "@plane/utils";
// plane-web
import { WorkFlowGroupTree } from "@/plane-web/components/workflow";

interface IGroupedBoardColumnHeader {
  column: IGroupByColumn;
  columnIndex: number;
  group_by: TIssueGroupByOptions | undefined;
  count: number;
}

export const GroupedBoardColumnHeader = observer(function GroupedBoardColumnHeader(props: IGroupedBoardColumnHeader) {
  const { column, columnIndex, group_by, count } = props;

  return (
    <div
      className={cn(
        "flex-shrink-0 w-[220px] px-3 py-2",
        "bg-surface-2 rounded-t-lg"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex size-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-xs">
          {column.icon ? column.icon : <Circle width={14} strokeWidth={2} />}
        </div>
        <div className="flex items-baseline gap-1 overflow-hidden">
          <span className="line-clamp-1 font-medium text-primary text-13">{column.name}</span>
          <span className="flex-shrink-0 text-12 font-medium text-tertiary">({count})</span>
        </div>
        <WorkFlowGroupTree groupBy={group_by} groupId={column.id} />
      </div>
    </div>
  );
});

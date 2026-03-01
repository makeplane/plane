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

import { observer } from "mobx-react";
// components
import type { IGanttBlock } from "@plane/types";
import { Row } from "@plane/ui";
import { cn } from "@plane/utils";
import { BLOCK_HEIGHT } from "@/components/timeline/constants";
import { IssueTimelineSidebarBlock } from "@/components/issues/issue-layouts/timeline/blocks";
// helpers
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import { UpdateStatusIcons } from "@/components/updates/status-icons";

type Props = {
  block: IGanttBlock;
};

export const EpicSidebarBlock = observer(function EpicSidebarBlock(props: Props) {
  const { block } = props;
  // store hooks
  const { updateActiveBlockId, isBlockActive, getNumberOfDaysFromPosition } = useTimeLineChartStore();
  const { getIsIssuePeeked } = useIssueDetail();

  const isBlockComplete = !!block?.start_date && !!block?.target_date;
  const duration = isBlockComplete ? getNumberOfDaysFromPosition(block?.position?.width) : undefined;

  if (!block?.data) return null;

  const isBlockHoveredOn = isBlockActive(block.id);

  return (
    <div
      className={cn("group/list-block", {
        "rounded-l border border-r-0 border-accent-subtle": getIsIssuePeeked(block.data.id),
      })}
      onMouseEnter={() => updateActiveBlockId(block.id)}
      onMouseLeave={() => updateActiveBlockId(null)}
    >
      <Row
        className={cn(
          "group w-full flex items-center gap-2 pr-4 bg-layer-transparent hover:bg-layer-transparent-hover",
          {
            "bg-layer-transparent-hover": isBlockHoveredOn,
          }
        )}
        style={{
          height: `${BLOCK_HEIGHT}px`,
        }}
      >
        <div className="flex h-full flex-grow items-center justify-between gap-2 truncate">
          <UpdateStatusIcons statusType={block.data.update_status} />
          <div className="flex-grow truncate">
            <IssueTimelineSidebarBlock issueId={block.data.id} isEpic />
          </div>
          {duration && (
            <div className="flex-shrink-0 text-13 text-secondary">
              <span>
                {duration} day{duration > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </Row>
    </div>
  );
});

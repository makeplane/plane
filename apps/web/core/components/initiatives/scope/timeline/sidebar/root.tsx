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
import type { RefObject } from "react";
// plane
import { EGanttBlockType } from "@plane/types";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { ProjectTimelineSidebarBlock } from "@/components/projects/list/with-grouping/layouts/timeline/blocks";
import { EpicSidebarBlock } from "./epic-block";

type Props = {
  activeBlockType: EGanttBlockType;
  blockIds: string[];
  loadMoreBlocks?: () => void;
  ganttContainerRef?: RefObject<HTMLDivElement>;
  showAllBlocks?: boolean;
  handleAddBlock: (type: EGanttBlockType) => Promise<void>;
};

export const FlatScopeGanttSidebar = observer(function FlatScopeGanttSidebar(props: Props) {
  const { activeBlockType, blockIds, showAllBlocks = false } = props;

  const { getBlockById } = useTimeLineChartStore();

  if (!blockIds) return null;

  return (
    <>
      <>
        {blockIds.map((blockId: string) => {
          const block = getBlockById(blockId);
          const isBlockVisibleOnSidebar = block?.start_date && block?.target_date;

          // hide the block if it doesn't have start and target dates and showAllBlocks is false
          if (!block || (!showAllBlocks && !isBlockVisibleOnSidebar)) return;

          switch (activeBlockType) {
            case EGanttBlockType.EPIC:
              return <EpicSidebarBlock key={blockId} block={block} />;
            case EGanttBlockType.PROJECT:
              return <ProjectTimelineSidebarBlock key={blockId} block={block} />;
          }
        })}
      </>
    </>
  );
});

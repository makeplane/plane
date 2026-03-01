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

import { useEffect } from "react";
import { observer } from "mobx-react";
// components
import type { IBlockUpdateData, IBlockUpdateDependencyData, TGanttBlockGroup } from "@plane/types";
// hooks

import { TimelineChartViewRoot } from "@/components/timeline";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";

type TimelineChartRootProps = {
  border?: boolean;
  title: string;
  blockGroups: TGanttBlockGroup[];
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  blockToRender: (data: any) => React.ReactNode;
  sidebarToRender: (props: any) => React.ReactNode;
  quickAdd?: React.ReactNode | undefined;
  canLoadMoreBlocks?: boolean;
  loadMoreBlocks?: () => void;
  updateBlockDates?: (updates: IBlockUpdateDependencyData[]) => Promise<void>;
  enableBlockLeftResize?: boolean | ((blockId: string) => boolean);
  enableBlockRightResize?: boolean | ((blockId: string) => boolean);
  enableBlockMove?: boolean | ((blockId: string) => boolean);
  enableReorder?: boolean | ((blockId: string) => boolean);
  enableAddBlock?: boolean | ((blockId: string) => boolean);
  enableSelection?: boolean | ((blockId: string) => boolean);
  enableDependency?: boolean | ((blockId: string) => boolean);
  bottomSpacing?: boolean;
  showAllBlocks?: boolean;
  showToday?: boolean;
  isEpic?: boolean;
};

export const GroupedTimelineChart = observer(function GroupedTimelineChart(props: TimelineChartRootProps) {
  const {
    border = true,
    title,
    blockGroups,
    blockUpdateHandler,
    sidebarToRender,
    blockToRender,
    loadMoreBlocks,
    canLoadMoreBlocks,
    enableBlockLeftResize = false,
    enableBlockRightResize = false,
    enableBlockMove = false,
    enableReorder = false,
    enableAddBlock = false,
    enableSelection = false,
    enableDependency = false,
    bottomSpacing = false,
    showAllBlocks = false,
    showToday = true,
    quickAdd,
    updateBlockDates,
    isEpic = false,
  } = props;

  const { setBlockGroups } = useTimeLineChartStore();

  const blockIds = blockGroups.flatMap((group) => group.blockIds);

  // update the timeline store with updated blockIds
  useEffect(() => {
    setBlockGroups(blockGroups);
  }, [blockGroups]);

  return (
    <TimelineChartViewRoot
      border={border}
      title={title}
      blockIds={blockIds}
      loadMoreBlocks={loadMoreBlocks}
      canLoadMoreBlocks={canLoadMoreBlocks}
      loaderTitle={""}
      blockUpdateHandler={blockUpdateHandler}
      sidebarToRender={sidebarToRender}
      blockToRender={blockToRender}
      enableBlockLeftResize={enableBlockLeftResize}
      enableBlockRightResize={enableBlockRightResize}
      enableBlockMove={enableBlockMove}
      enableReorder={enableReorder}
      enableAddBlock={enableAddBlock}
      enableSelection={enableSelection}
      enableDependency={enableDependency}
      bottomSpacing={bottomSpacing}
      showAllBlocks={showAllBlocks}
      quickAdd={quickAdd}
      showToday={showToday}
      updateBlockDates={updateBlockDates}
      isEpic={isEpic}
    />
  );
});

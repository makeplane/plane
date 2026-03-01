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

// components
import { observer } from "mobx-react";
import RenderIfVisible from "@/components/core/render-if-visible-HOC";
// hooks
import { TimelineBlockRow } from "@/components/timeline/blocks/block-row";
import { BLOCK_HEIGHT } from "@/components/timeline/constants";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import type { IBlockUpdateData, IGanttBlock } from "@plane/types";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";

type TimelineChartRowListProps = {
  blockIds: string[];
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  handleScrollToBlock: (block: IGanttBlock) => void;
  enableAddBlock: boolean | ((blockId: string) => boolean);
  showAllBlocks: boolean;
  selectionHelpers: TSelectionHelper;
  ganttContainerRef: React.RefObject<HTMLDivElement>;
};

export const TimelineChartRowList = observer(function TimelineChartRowList(props: TimelineChartRowListProps) {
  const {
    blockIds,
    blockUpdateHandler,
    handleScrollToBlock,
    enableAddBlock,
    showAllBlocks,
    selectionHelpers,
    ganttContainerRef,
  } = props;

  const { getGroupedBlockIds, isGroupingEnabled } = useTimeLineChartStore();

  const renderBlockRow = (blockIds: string[]) =>
    blockIds?.map((blockId) => (
      <RenderIfVisible
        key={blockId}
        root={ganttContainerRef}
        horizontalOffset={100}
        verticalOffset={200}
        classNames="relative min-w-full w-max"
        placeholderChildren={<div className="w-full pointer-events-none" style={{ height: `${BLOCK_HEIGHT}px` }} />}
        shouldRecordHeights={false}
      >
        <TimelineBlockRow
          key={blockId}
          blockId={blockId}
          showAllBlocks={showAllBlocks}
          blockUpdateHandler={blockUpdateHandler}
          handleScrollToBlock={handleScrollToBlock}
          enableAddBlock={typeof enableAddBlock === "function" ? enableAddBlock(blockId) : enableAddBlock}
          selectionHelpers={selectionHelpers}
          ganttContainerRef={ganttContainerRef}
        />
      </RenderIfVisible>
    ));

  return (
    <div className="absolute top-0 left-0 min-w-full w-max">
      {isGroupingEnabled
        ? getGroupedBlockIds().map((group) => {
            const blockIds = group.blockIds;
            return (
              <>
                <div className="relative" style={{ height: `${BLOCK_HEIGHT}px` }} />
                {renderBlockRow(blockIds)}
              </>
            );
          })
        : renderBlockRow(blockIds)}
    </div>
  );
});

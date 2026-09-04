/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// ui
import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
import { useTranslation } from "@plane/i18n";
import { GANTT_TIMELINE_TYPE } from "@plane/types";
import type { IBlockUpdateData } from "@plane/types";
// components
// hooks
import { useTimeLineChart } from "@/hooks/use-timeline-chart";
import { GanttDnDHOC } from "../gantt-dnd-HOC";
import { handleOrderChange } from "../utils";
import { ModulesSidebarBlock } from "./block";
// types

type Props = {
  title: string;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  blockIds: string[];
  enableReorder: boolean;
};

export const ModuleGanttSidebar = observer(function ModuleGanttSidebar(props: Props) {
  const { t } = useTranslation();
  const { blockUpdateHandler, blockIds, enableReorder } = props;

  const { getBlockById } = useTimeLineChart(GANTT_TIMELINE_TYPE.MODULE);

  const handleOnDrop = (
    draggingBlockId: string | undefined,
    droppedBlockId: string | undefined,
    dropAtEndOfList: boolean
  ) => {
    handleOrderChange(draggingBlockId, droppedBlockId, dropAtEndOfList, blockIds, getBlockById, blockUpdateHandler);
  };

  return (
    <div className="h-full">
      {blockIds ? (
        blockIds.map((blockId, index) => (
          <GanttDnDHOC
            key={blockId}
            id={blockId}
            isLastChild={index === blockIds.length - 1}
            isDragEnabled={enableReorder}
            onDrop={handleOnDrop}
          >
            {(isDragging: boolean) => <ModulesSidebarBlock blockId={blockId} isDragging={isDragging} />}
          </GanttDnDHOC>
        ))
      ) : (
        <Skeleton aria-label={t("aria_labels.loading.sidebar")}>
          <div className="space-y-3 pr-2">
            <SkeletonItem blockSize="34px" />
            <SkeletonItem blockSize="34px" />
            <SkeletonItem blockSize="34px" />
            <SkeletonItem blockSize="34px" />
          </div>
        </Skeleton>
      )}
    </div>
  );
});

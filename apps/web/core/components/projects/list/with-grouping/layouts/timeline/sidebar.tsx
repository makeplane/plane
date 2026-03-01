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

import type { RefObject } from "react";
import { observer } from "mobx-react";
// plane
import { Loader } from "@plane/ui";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { ProjectTimelineSidebarBlock } from "./blocks";

type Props = {
  canLoadMoreBlocks?: boolean;
  loadMoreBlocks?: () => void;
  ganttContainerRef: RefObject<HTMLDivElement>;
  blockIds: string[];
  showAllBlocks?: boolean;
};

export const ProjectTimelineSidebar = observer(function ProjectTimelineSidebar(props: Props) {
  const { blockIds, canLoadMoreBlocks, showAllBlocks = false } = props;

  const { getBlockById } = useTimeLineChartStore();

  return (
    <div>
      {blockIds ? (
        <>
          {blockIds.map((blockId) => {
            const block = getBlockById(blockId);
            const isBlockVisibleOnSidebar = block?.start_date && block?.target_date;

            // hide the block if it doesn't have start and target dates and showAllBlocks is false
            if (!block || (!showAllBlocks && !isBlockVisibleOnSidebar)) return;

            return <ProjectTimelineSidebarBlock key={blockId} block={block} />;
          })}
          {canLoadMoreBlocks && (
            <div className="p-2">
              <div className="flex h-10 md:h-8 w-full items-center justify-between gap-1.5 rounded-sm md:px-1 px-4 py-1.5 bg-layer-1 animate-pulse" />
            </div>
          )}
        </>
      ) : (
        <Loader className="space-y-3 pr-2">
          <Loader.Item height="34px" />
          <Loader.Item height="34px" />
          <Loader.Item height="34px" />
          <Loader.Item height="34px" />
        </Loader>
      )}
    </div>
  );
});

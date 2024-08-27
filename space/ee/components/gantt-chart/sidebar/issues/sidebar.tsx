"use client";

import { RefObject, useState } from "react";
import { observer } from "mobx-react";
// plane
import { TLoader } from "@plane/types";
import { Loader } from "@plane/ui";
//hooks
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
//
import { IGanttBlock } from "../../types";
import { IssuesSidebarBlock } from "./block";

type Props = {
  getBlockById: (id: string) => IGanttBlock;
  canLoadMoreBlocks?: boolean;
  loadMoreBlocks?: () => void;
  ganttContainerRef: RefObject<HTMLDivElement>;
  blockIds: string[];
  getIssueLoader: (groupId?: string | undefined, subGroupId?: string | undefined) => TLoader;
  showAllBlocks?: boolean;
};

export const IssueGanttSidebar: React.FC<Props> = observer((props) => {
  const {
    blockIds,
    getBlockById,
    getIssueLoader,
    loadMoreBlocks,
    canLoadMoreBlocks,
    ganttContainerRef,
    showAllBlocks = false,
  } = props;

  const [intersectionElement, setIntersectionElement] = useState<HTMLDivElement | null>(null);

  const isPaginating = !!getIssueLoader();

  useIntersectionObserver(
    ganttContainerRef,
    isPaginating ? null : intersectionElement,
    loadMoreBlocks,
    "100% 0% 100% 0%"
  );

  return (
    <div>
      {blockIds ? (
        <>
          {blockIds.map((blockId) => {
            const block = getBlockById(blockId);
            const isBlockVisibleOnSidebar = block?.start_date && block?.target_date;

            // hide the block if it doesn't have start and target dates and showAllBlocks is false
            if (!block || (!showAllBlocks && !isBlockVisibleOnSidebar)) return;

            return <IssuesSidebarBlock key={blockId} block={block} />;
          })}
          {canLoadMoreBlocks && (
            <div ref={setIntersectionElement} className="p-2">
              <div className="flex h-10 md:h-8 w-full items-center justify-between gap-1.5 rounded md:px-1 px-4 py-1.5 bg-custom-background-80 animate-pulse" />
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

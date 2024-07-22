"use client";

import { MutableRefObject, forwardRef, useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
//types
import {
  TGroupedIssues,
  IIssueDisplayProperties,
  TSubGroupedIssues,
  TIssueGroupByOptions,
  TPaginationData,
  TLoader,
} from "@plane/types";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
//
import { KanbanIssueBlocksList } from ".";

interface IKanbanGroup {
  groupId: string;
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues;
  displayProperties: IIssueDisplayProperties | undefined;
  subGroupBy: TIssueGroupByOptions | undefined;
  subGroupId: string;
  loadMoreIssues: (groupId?: string, subGroupId?: string) => void;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
  getPaginationData: (groupId: string | undefined, subGroupId: string | undefined) => TPaginationData | undefined;
  getIssueLoader: (groupId?: string | undefined, subGroupId?: string | undefined) => TLoader;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
}

// Loader components
const KanbanIssueBlockLoader = forwardRef<HTMLSpanElement>((props, ref) => (
  <span ref={ref} className="block h-28 m-1.5 animate-pulse bg-custom-background-80 rounded" />
));
KanbanIssueBlockLoader.displayName = "KanbanIssueBlockLoader";

export const KanbanGroup = observer((props: IKanbanGroup) => {
  const {
    groupId,
    subGroupId,
    subGroupBy,
    displayProperties,
    groupedIssueIds,
    loadMoreIssues,
    getGroupIssueCount,
    getPaginationData,
    getIssueLoader,
    scrollableContainerRef,
  } = props;

  // hooks
  const [intersectionElement, setIntersectionElement] = useState<HTMLSpanElement | null>(null);
  const columnRef = useRef<HTMLDivElement | null>(null);

  const containerRef = subGroupBy && scrollableContainerRef ? scrollableContainerRef : columnRef;

  const loadMoreIssuesInThisGroup = useCallback(() => {
    loadMoreIssues(groupId, subGroupId === "null" ? undefined : subGroupId);
  }, [loadMoreIssues, groupId, subGroupId]);

  const isPaginating = !!getIssueLoader(groupId, subGroupId);

  useIntersectionObserver(
    containerRef,
    isPaginating ? null : intersectionElement,
    loadMoreIssuesInThisGroup,
    `0% 100% 100% 100%`
  );

  const isSubGroup = !!subGroupId && subGroupId !== "null";

  const issueIds = isSubGroup
    ? (groupedIssueIds as TSubGroupedIssues)?.[groupId]?.[subGroupId] ?? []
    : (groupedIssueIds as TGroupedIssues)?.[groupId] ?? [];

  const groupIssueCount = getGroupIssueCount(groupId, subGroupId, false) ?? 0;
  const nextPageResults = getPaginationData(groupId, subGroupId)?.nextPageResults;

  const loadMore = isPaginating ? (
    <KanbanIssueBlockLoader />
  ) : (
    <div
      className="w-full p-3 text-sm font-medium text-custom-primary-100 hover:text-custom-primary-200 hover:underline cursor-pointer"
      onClick={loadMoreIssuesInThisGroup}
    >
      {" "}
      Load More &darr;
    </div>
  );

  const shouldLoadMore = nextPageResults === undefined ? issueIds?.length < groupIssueCount : !!nextPageResults;

  return (
    <div
      id={`${groupId}__${subGroupId}`}
      className={cn("relative h-full transition-all min-h-[120px]", { "vertical-scrollbar scrollbar-md": !subGroupBy })}
      ref={columnRef}
    >
      <KanbanIssueBlocksList
        subGroupId={subGroupId}
        groupId={groupId}
        issueIds={issueIds || []}
        displayProperties={displayProperties}
        scrollableContainerRef={scrollableContainerRef}
      />

      {shouldLoadMore && (isSubGroup ? <>{loadMore}</> : <KanbanIssueBlockLoader ref={setIntersectionElement} />)}
    </div>
  );
});

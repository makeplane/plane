"use client";

import { Fragment, MutableRefObject, forwardRef, useRef, useState } from "react";
import { observer } from "mobx-react";
import { cn } from "@plane/editor";
// plane
import { IGroupByColumn, TIssueGroupByOptions, IIssueDisplayProperties, TPaginationData, TLoader } from "@plane/types";
// hooks
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
//
import { IssueBlocksList } from "./blocks-list";
import { HeaderGroupByCard } from "./headers/group-by-card";

interface Props {
  groupIssueIds: string[] | undefined;
  group: IGroupByColumn;
  groupBy: TIssueGroupByOptions | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  showEmptyGroup?: boolean;
  loadMoreIssues: (groupId?: string) => void;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
  getPaginationData: (groupId: string | undefined, subGroupId: string | undefined) => TPaginationData | undefined;
  getIssueLoader: (groupId?: string | undefined, subGroupId?: string | undefined) => TLoader;
}

// List loader component
const ListLoaderItemRow = forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref} className="flex items-center justify-between h-11 p-3 border-b border-custom-border-200">
    <div className="flex items-center gap-3">
      <span className="h-5 w-10 bg-custom-background-80 rounded animate-pulse" />
      <span className={`h-5 w-52 bg-custom-background-80 rounded animate-pulse`} />
    </div>
    <div className="flex items-center gap-2">
      {[...Array(6)].map((_, index) => (
        <Fragment key={index}>
          <span key={index} className="h-5 w-5 bg-custom-background-80 rounded animate-pulse" />
        </Fragment>
      ))}
    </div>
  </div>
));
ListLoaderItemRow.displayName = "ListLoaderItemRow";

export const ListGroup = observer((props: Props) => {
  const {
    groupIssueIds = [],
    group,
    groupBy,
    displayProperties,
    containerRef,
    showEmptyGroup,
    loadMoreIssues,
    getGroupIssueCount,
    getPaginationData,
    getIssueLoader,
  } = props;
  const [isExpanded, setIsExpanded] = useState(true);
  const groupRef = useRef<HTMLDivElement | null>(null);

  const [intersectionElement, setIntersectionElement] = useState<HTMLDivElement | null>(null);

  const groupIssueCount = getGroupIssueCount(group.id, undefined, false) ?? 0;
  const nextPageResults = getPaginationData(group.id, undefined)?.nextPageResults;
  const isPaginating = !!getIssueLoader(group.id);

  useIntersectionObserver(containerRef, isPaginating ? null : intersectionElement, loadMoreIssues, `100% 0% 100% 0%`);

  const shouldLoadMore =
    nextPageResults === undefined && groupIssueCount !== undefined && groupIssueIds
      ? groupIssueIds.length < groupIssueCount
      : !!nextPageResults;

  const loadMore = isPaginating ? (
    <ListLoaderItemRow />
  ) : (
    <div
      className={
        "h-11 relative flex items-center gap-3 bg-custom-background-100 border border-transparent border-t-custom-border-200 pl-6 p-3 text-sm font-medium text-custom-primary-100 hover:text-custom-primary-200 hover:underline cursor-pointer"
      }
      onClick={() => loadMoreIssues(group.id)}
    >
      Load More &darr;
    </div>
  );

  const validateEmptyIssueGroups = (issueCount: number = 0) => {
    if (!showEmptyGroup && issueCount <= 0) return false;
    return true;
  };

  const toggleListGroup = () => {
    setIsExpanded((prevState) => !prevState);
  };

  const shouldExpand = (!!groupIssueCount && isExpanded) || !groupBy;

  return validateEmptyIssueGroups(groupIssueCount) ? (
    <div ref={groupRef} className={cn(`relative flex flex-shrink-0 flex-col border-[1px] border-transparent`)}>
      <div className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 pl-2 pr-3 py-1">
        <HeaderGroupByCard
          groupID={group.id}
          icon={group.icon}
          title={group.name || ""}
          count={groupIssueCount}
          toggleListGroup={toggleListGroup}
        />
      </div>
      {shouldExpand && (
        <div className="relative">
          {groupIssueIds && (
            <IssueBlocksList
              issueIds={groupIssueIds}
              groupId={group.id}
              displayProperties={displayProperties}
              containerRef={containerRef}
            />
          )}

          {shouldLoadMore && (groupBy ? <>{loadMore}</> : <ListLoaderItemRow ref={setIntersectionElement} />)}
        </div>
      )}
    </div>
  ) : null;
});

import type { MutableRefObject } from "react";
import { forwardRef, useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
//types
import type {
  TGroupedIssues,
  IIssueDisplayProperties,
  TSubGroupedIssues,
  TIssueGroupByOptions,
  TPaginationData,
  TLoader,
} from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
// local imports
import { KanbanIssueBlocksList } from "./blocks-list";

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
  getIssueLoader: (groupId?: string, subGroupId?: string) => TLoader;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
}

// Loader components
const KanbanIssueBlockLoader = forwardRef(function KanbanIssueBlockLoader(
  props: Record<string, unknown>,
  ref: React.ForwardedRef<HTMLSpanElement>
) {
  return <span ref={ref} className="block h-28 m-1.5 animate-pulse bg-layer-1 rounded-sm" />;
});
KanbanIssueBlockLoader.displayName = "KanbanIssueBlockLoader";

export const KanbanGroup = observer(function KanbanGroup(props: IKanbanGroup) {
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
    ? ((groupedIssueIds as TSubGroupedIssues)?.[groupId]?.[subGroupId] ?? [])
    : ((groupedIssueIds as TGroupedIssues)?.[groupId] ?? []);

  const groupIssueCount = getGroupIssueCount(groupId, subGroupId, false) ?? 0;
  const nextPageResults = getPaginationData(groupId, subGroupId)?.nextPageResults;

  const loadMore = isPaginating ? (
    <KanbanIssueBlockLoader />
  ) : (
    <div
      className="w-full p-3 text-13 font-medium text-accent-primary hover:text-accent-secondary hover:underline cursor-pointer"
      onClick={loadMoreIssuesInThisGroup}
      role="button"
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

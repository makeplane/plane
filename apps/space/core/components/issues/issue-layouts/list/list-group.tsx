import type { MutableRefObject } from "react";
import { Fragment, forwardRef, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
// plane types
import type {
  IGroupByColumn,
  TIssueGroupByOptions,
  IIssueDisplayProperties,
  TPaginationData,
  TLoader,
} from "@plane/types";
// plane utils
import { cn } from "@plane/utils";
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
  getIssueLoader: (groupId?: string, subGroupId?: string) => TLoader;
}

// List loader component
const ListLoaderItemRow = forwardRef(function ListLoaderItemRow(
  props: Record<string, unknown>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <div ref={ref} className="flex items-center justify-between h-11 p-3 border-b border-subtle">
      <div className="flex items-center gap-3">
        <span className="h-5 w-10 bg-layer-1 rounded-sm animate-pulse" />
        <span className={`h-5 w-52 bg-layer-1 rounded-sm animate-pulse`} />
      </div>
      <div className="flex items-center gap-2">
        {[...Array(6)].map((_, index) => (
          <Fragment key={index}>
            <span key={index} className="h-5 w-5 bg-layer-1 rounded-sm animate-pulse" />
          </Fragment>
        ))}
      </div>
    </div>
  );
});
ListLoaderItemRow.displayName = "ListLoaderItemRow";

export const ListGroup = observer(function ListGroup(props: Props) {
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
  // hooks
  const { t } = useTranslation();

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
        "h-11 relative flex items-center gap-3 bg-surface-1 border border-transparent border-t-subtle-1 pl-6 p-3 text-13 font-medium text-accent-primary hover:text-accent-secondary hover:underline cursor-pointer"
      }
      onClick={() => loadMoreIssues(group.id)}
      role="button"
    >
      {t("common.load_more")} &darr;
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
    <div ref={groupRef} className={cn(`relative flex shrink-0 flex-col border-[1px] border-transparent`)}>
      <div className="sticky top-0 z-2 w-full shrink-0 border-b border-subtle">
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

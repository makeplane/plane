import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
// components
import { Icon } from "@/components/ui";
// hooks
import { useIssue } from "@/hooks/store";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
// components
import { IssueKanBanBlock } from "./block";
import { IssueKanBanHeader } from "./header";

type Props = {
  anchor: string;
  stateId: string;
  issueIds: string[];
};

export const Column = observer((props: Props) => {
  const { anchor, stateId, issueIds } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [intersectionElement, setIntersectionElement] = useState<HTMLDivElement | null>(null);

  const { fetchNextPublicIssues, getPaginationData, getIssueLoader, getGroupIssueCount } = useIssue();

  const loadMoreIssuesInThisGroup = useCallback(() => {
    fetchNextPublicIssues(anchor, stateId);
  }, [fetchNextPublicIssues, anchor, stateId]);

  const isPaginating = !!getIssueLoader(stateId);
  const nextPageResults = getPaginationData(stateId, undefined)?.nextPageResults;

  useIntersectionObserver(
    containerRef,
    isPaginating ? null : intersectionElement,
    loadMoreIssuesInThisGroup,
    `0% 100% 100% 100%`
  );

  const groupIssueCount = getGroupIssueCount(stateId, undefined, false);
  const shouldLoadMore =
    nextPageResults === undefined && groupIssueCount !== undefined
      ? issueIds?.length < groupIssueCount
      : !!nextPageResults;

  return (
    <div key={stateId} className="relative flex h-full w-[340px] flex-shrink-0 flex-col">
      <div className="flex-shrink-0">
        <IssueKanBanHeader stateId={stateId} />
      </div>
      <div className="hide-vertical-scrollbar h-full w-full overflow-hidden overflow-y-auto" ref={containerRef}>
        {issueIds && issueIds.length > 0 ? (
          <div className="space-y-3 px-2 pb-2">
            {issueIds.map((issueId) => (
              <IssueKanBanBlock key={issueId} anchor={anchor} issueId={issueId} />
            ))}
            {shouldLoadMore && (
              <div className="w-full h-[100px] bg-custom-background-80 animate-pulse" ref={setIntersectionElement} />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 pt-10 text-center text-sm font-medium text-custom-text-200">
            <Icon iconName="stack" />
            No issues in this state
          </div>
        )}
      </div>
    </div>
  );
});

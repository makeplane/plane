import { useCallback } from "react";
import { observer } from "mobx-react";
// hooks
import { useIssue } from "@/hooks/store";
// components
import { IssueListLayoutBlock } from "./block";
import { IssueListLayoutHeader } from "./header";

type Props = {
  anchor: string;
  stateId: string;
  issueIds: string[];
};

export const Group = observer((props: Props) => {
  const { anchor, stateId, issueIds } = props;

  const { fetchNextPublicIssues, getPaginationData, getIssueLoader, getGroupIssueCount } = useIssue();

  const loadMoreIssuesInThisGroup = useCallback(() => {
    fetchNextPublicIssues(anchor, stateId);
  }, [stateId]);

  const isPaginating = !!getIssueLoader(stateId);
  const nextPageResults = getPaginationData(stateId, undefined)?.nextPageResults;

  const groupIssueCount = getGroupIssueCount(stateId, undefined, false);
  const shouldLoadMore =
    nextPageResults === undefined && groupIssueCount !== undefined
      ? issueIds?.length < groupIssueCount
      : !!nextPageResults;

  return (
    <div key={stateId} className="relative w-full">
      <IssueListLayoutHeader stateId={stateId} />
      {issueIds && issueIds.length > 0 ? (
        <div className="divide-y divide-custom-border-200">
          {issueIds.map((issueId) => (
            <IssueListLayoutBlock key={issueId} anchor={anchor} issueId={issueId} />
          ))}
          {isPaginating ? (
            <div className="w-full h-[46px] bg-custom-background-80 animate-pulse" />
          ) : (
            shouldLoadMore && (
              <div
                className="w-full min-h-[45px] bg-custom-background-100 p-3 text-sm border-b-[1px] cursor-pointer text-custom-text-350 hover:text-custom-text-300"
                onClick={loadMoreIssuesInThisGroup}
              >
                Load More &darr;
              </div>
            )
          )}
        </div>
      ) : (
        <div className="bg-custom-background-100 p-3 text-sm text-custom-text-400">No issues.</div>
      )}
    </div>
  );
});

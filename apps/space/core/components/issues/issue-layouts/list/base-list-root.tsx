import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
// types
import type { IIssueDisplayProperties, TGroupedIssues } from "@plane/types";
// constants
// components
import { IssueLayoutHOC } from "@/components/issues/issue-layouts/issue-layout-HOC";
// hooks
import { useIssue } from "@/hooks/store/use-issue";
import { List } from "./default";

type Props = {
  anchor: string;
};

export const IssuesListLayoutRoot = observer(function IssuesListLayoutRoot(props: Props) {
  const { anchor } = props;
  // store hooks
  const {
    groupedIssueIds: storeGroupedIssueIds,
    fetchNextPublicIssues,
    getGroupIssueCount,
    getPaginationData,
    getIssueLoader,
  } = useIssue();

  const groupedIssueIds = storeGroupedIssueIds as TGroupedIssues | undefined;
  // auth
  const displayProperties: IIssueDisplayProperties = useMemo(
    () => ({
      key: true,
      state: true,
      labels: true,
      priority: true,
      due_date: true,
    }),
    []
  );

  const loadMoreIssues = useCallback(
    (groupId?: string) => {
      fetchNextPublicIssues(anchor, groupId);
    },
    [anchor, fetchNextPublicIssues]
  );

  return (
    <IssueLayoutHOC getGroupIssueCount={getGroupIssueCount} getIssueLoader={getIssueLoader}>
      <div className="relative size-full">
        <List
          displayProperties={displayProperties}
          groupBy={"state"}
          groupedIssueIds={groupedIssueIds ?? {}}
          loadMoreIssues={loadMoreIssues}
          getGroupIssueCount={getGroupIssueCount}
          getPaginationData={getPaginationData}
          getIssueLoader={getIssueLoader}
          showEmptyGroup
        />
      </div>
    </IssueLayoutHOC>
  );
});

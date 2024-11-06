import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
// types
import { IIssueDisplayProperties, TGroupedIssues } from "@plane/types";
// constants
// components
import { IssueLayoutHOC } from "@/components/issues/issue-layouts/issue-layout-HOC";
// hooks
import { useIssue } from "@/hooks/store";
import { List } from "./default";

type Props = {
  anchor: string;
};

export const IssuesListLayoutRoot = observer((props: Props) => {
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
    [fetchNextPublicIssues]
  );

  return (
    <IssueLayoutHOC getGroupIssueCount={getGroupIssueCount} getIssueLoader={getIssueLoader}>
      <div className={`relative size-full bg-custom-background-90`}>
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

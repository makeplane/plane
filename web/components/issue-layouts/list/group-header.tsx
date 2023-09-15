import { FC } from "react";
// lib
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface IIssueListGroupHeader {
  groupId: string;
  groupBy: string;
}

export const IssueListGroupHeader: FC<IIssueListGroupHeader> = (props) => {
  const { groupId, groupBy } = props;

  const { issueView: issueViewStore, issueFilters: issueFilterStore }: RootStore = useMobxStore();

  return (
    <div>
      {groupBy === "state" && <>{issueFilterStore.getProjectStateById(groupId)?.name}</>}
      {groupBy === "state_detail.group" && <>{groupId}</>}
      {groupBy === "priority" && <>{groupId}</>}
      {groupBy === "project" && (
        <>{issueFilterStore.workspaceProjects?.find((p) => (p.id = groupId))}</>
      )}
      {groupBy === "labels" && (
        <>{issueFilterStore.projectLabels?.find((p) => p.id === groupId)?.name || " None"}</>
      )}
      {groupBy === "assignees" && (
        <>
          {issueFilterStore.projectMembers?.find((p) => p?.member?.id === groupId)?.member
            ?.display_name || " None"}
        </>
      )}
      {groupBy === "created_by" && (
        <>
          {issueFilterStore.projectMembers?.find((p) => p?.member?.id === groupId)?.member
            ?.display_name || " None"}
        </>
      )}
    </div>
  );
};

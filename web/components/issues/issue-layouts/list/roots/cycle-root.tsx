import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CycleIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
// constants
import { BaseListRoot } from "../base-list-root";
import { IProjectStore } from "store/project";
import { EIssueActions } from "../../types";

export interface ICycleListLayout {}

export const CycleListLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, cycleId } = router.query;
  // store
  const {
    cycleIssues: cycleIssueStore,
    cycleIssuesFilter: cycleIssueFilterStore,
    issueDetail: issueDetailStore,
  } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;

      //cycleIssueStore.updateIssueStructure(group_by, null, issue);
      cycleIssueStore.updateIssue(workspaceSlug.toString(), issue.project, cycleId?.toString() || "", issue.id, issue);
    },
    [EIssueActions.DELETE]: (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;
      issueDetailStore.deleteIssue(workspaceSlug.toString(), issue.project, issue.id);
      //cycleIssueStore.  (workspaceSlug.toString(), issue.project, cycleId?.toString() || "", issue.id, issue);
    },
    [EIssueActions.REMOVE]: (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;

      cycleIssueStore.removeIssue(workspaceSlug.toString(), issue.project, cycleId?.toString() || "", issue.id);
    },
  };
  const getProjects = (projectStore: IProjectStore) => {
    if (!workspaceSlug) return null;
    return projectStore?.projects[workspaceSlug.toString()] || null;
  };

  return (
    <BaseListRoot
      issueFilterStore={cycleIssueFilterStore}
      issueStore={cycleIssueStore}
      QuickActions={CycleIssueQuickActions}
      issueActions={issueActions}
      getProjects={getProjects}
    />
  );
});

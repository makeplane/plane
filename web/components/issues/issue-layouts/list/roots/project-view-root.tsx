import React from "react";
import { observer } from "mobx-react-lite";

// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
// constants
import { useRouter } from "next/router";
import { EIssueActions } from "../../types";
import { IProjectStore } from "store/project";
import { IIssue } from "types";
// components
import { BaseListRoot } from "../base-list-root";
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
import { EProjectStore } from "store/command-palette.store";

export interface IViewListLayout {}

export const ProjectViewListLayout: React.FC = observer(() => {
  const { viewIssues: projectViewIssueStore, viewIssuesFilter: projectViewIssueFilterStore }: RootStore =
    useMobxStore();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  if (!workspaceSlug || !projectId) return null;

  const issueActions = {
    [EIssueActions.UPDATE]: async (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !projectId) return;

      await projectViewIssueStore.updateIssue(workspaceSlug, projectId, issue.id, issue);
    },
    [EIssueActions.DELETE]: async (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !projectId) return;

      await projectViewIssueStore.removeIssue(workspaceSlug, projectId, issue.id);
    },
  };

  const getProjects = (projectStore: IProjectStore) => projectStore.workspaceProjects;

  return (
    <BaseListRoot
      issueFilterStore={projectViewIssueFilterStore}
      issueStore={projectViewIssueStore}
      QuickActions={ProjectIssueQuickActions}
      issueActions={issueActions}
      getProjects={getProjects}
      currentStore={EProjectStore.PROJECT_VIEW}
    />
  );
});

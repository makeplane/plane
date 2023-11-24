import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// store
import { useMobxStore } from "lib/mobx/store-provider";
// constant
import { IIssue } from "types";
import { EIssueActions } from "../../types";
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
// components
import { BaseKanBanRoot } from "../base-kanban-root";
import { EProjectStore } from "store/command-palette.store";

export interface IViewKanBanLayout {}

export const ProjectViewKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query as { workspaceSlug: string };

  const {
    viewIssues: projectViewIssuesStore,
    viewIssuesFilter: projectIssueViewFiltersStore,
    issueKanBanView: projectViewIssueKanBanViewStore,
  } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      await projectViewIssuesStore.updateIssue(workspaceSlug, issue.project, issue.id, issue);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      await projectViewIssuesStore.removeIssue(workspaceSlug, issue.project, issue.id);
    },
  };

  return (
    <BaseKanBanRoot
      issueActions={issueActions}
      issuesFilterStore={projectIssueViewFiltersStore}
      issueStore={projectViewIssuesStore}
      kanbanViewStore={projectViewIssueKanBanViewStore}
      showLoader={true}
      QuickActions={ProjectIssueQuickActions}
      currentStore={EProjectStore.PROJECT_VIEW}
    />
  );
});

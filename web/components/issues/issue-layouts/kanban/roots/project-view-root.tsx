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

export interface IViewKanBanLayout {}

export const ProjectViewKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query as { workspaceSlug: string };

  const {
    viewIssues: projectViewIssuesStore,
    issueKanBanView: projectViewIssueKanBanViewStore,
    issueDetail: issueDetailStore,
  } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      await issueDetailStore.updateIssue(workspaceSlug, issue.project, issue.id, issue);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      await issueDetailStore.deleteIssue(workspaceSlug, issue.project, issue.id);
    },
  };

  return (
    <BaseKanBanRoot
      issueActions={issueActions}
      issueStore={projectViewIssuesStore}
      kanbanViewStore={projectViewIssueKanBanViewStore}
      showLoader={true}
      QuickActions={ProjectIssueQuickActions}
    />
  );
});

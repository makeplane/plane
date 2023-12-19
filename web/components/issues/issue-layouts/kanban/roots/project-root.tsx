import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ProjectIssueQuickActions } from "components/issues";
import { BaseKanBanRoot } from "../base-kanban-root";
// types
import { IIssue } from "types";
// constants
import { EIssueActions } from "../../types";
import { EProjectStore } from "store/application/command-palette.store";

import { EIssuesStoreType } from "constants/issue";
import { useIssues } from "hooks/store/use-issues";

export interface IKanBanLayout {}

export const KanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query as { workspaceSlug: string; projectId: string };

  const {
    issue: { issueKanBanView: issueKanBanViewStore },
  } = useMobxStore();

  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT);

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: IIssue) => {
        if (!workspaceSlug) return;

        await issues.updateIssue(workspaceSlug, issue.project, issue.id, issue);
      },
      [EIssueActions.DELETE]: async (issue: IIssue) => {
        if (!workspaceSlug) return;

        await issues.removeIssue(workspaceSlug, issue.project, issue.id);
      },
    }),
    [issues]
  );

  return (
    <BaseKanBanRoot
      issueActions={issueActions}
      issues={issues}
      issuesFilter={issuesFilter}
      kanbanViewStore={issueKanBanViewStore}
      showLoader={true}
      QuickActions={ProjectIssueQuickActions}
      currentStore={EProjectStore.PROJECT}
    />
  );
});

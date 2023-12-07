import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ProjectIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
// constants
import { EIssueActions } from "../../types";
import { BaseKanBanRoot } from "../base-kanban-root";
import { EProjectStore } from "store/command-palette.store";
import { IGroupedIssues, IIssueResponse, ISubGroupedIssues, TUnGroupedIssues } from "store/issues/types";

export interface IKanBanLayout {}

export const KanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  const {
    projectIssues: issueStore,
    projectIssuesFilter: issuesFilterStore,
    issueKanBanView: issueKanBanViewStore,
    kanBanHelpers: kanBanHelperStore,
  } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      await issueStore.updateIssue(workspaceSlug, issue.project, issue.id, issue);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      await issueStore.removeIssue(workspaceSlug, issue.project, issue.id);
    },
  };

  const handleDragDrop = async (
    source: any,
    destination: any,
    subGroupBy: string | null,
    groupBy: string | null,
    issues: IIssueResponse | undefined,
    issueWithIds: IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined
  ) =>
    await kanBanHelperStore.handleDragDrop(
      source,
      destination,
      workspaceSlug,
      projectId,
      issueStore,
      subGroupBy,
      groupBy,
      issues,
      issueWithIds
    );

  return (
    <BaseKanBanRoot
      issueActions={issueActions}
      issuesFilterStore={issuesFilterStore}
      issueStore={issueStore}
      kanbanViewStore={issueKanBanViewStore}
      showLoader={true}
      QuickActions={ProjectIssueQuickActions}
      currentStore={EProjectStore.PROJECT}
      handleDragDrop={handleDragDrop}
    />
  );
});

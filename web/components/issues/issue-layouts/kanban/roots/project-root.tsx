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

export interface IKanBanLayout {}

export const KanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query as { workspaceSlug: string };

  const {
    projectIssues: issueStore,
    projectIssuesFilter: issuesFilterStore,
    issueKanBanView: issueKanBanViewStore,
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

  return (
    <BaseKanBanRoot
      issueActions={issueActions}
      issuesFilterStore={issuesFilterStore}
      issueStore={issueStore}
      kanbanViewStore={issueKanBanViewStore}
      showLoader={true}
      QuickActions={ProjectIssueQuickActions}
      currentStore={EProjectStore.PROJECT}
    />
  );
});

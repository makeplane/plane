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

export const ProfileIssuesKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, userId } = router.query as { workspaceSlug: string; userId: string };

  const {
    workspaceProfileIssues: profileIssuesStore,
    workspaceProfileIssuesFilter: profileIssueFiltersStore,
    issueKanBanView: issueKanBanViewStore,
  } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug || !userId) return;

      await profileIssuesStore.updateIssue(workspaceSlug, userId, issue.id, issue);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug || !userId) return;

      await profileIssuesStore.removeIssue(workspaceSlug, issue.project, issue.id, userId);
    },
  };

  return (
    <BaseKanBanRoot
      issueActions={issueActions}
      issuesFilterStore={profileIssueFiltersStore}
      issueStore={profileIssuesStore}
      kanbanViewStore={issueKanBanViewStore}
      showLoader={true}
      QuickActions={ProjectIssueQuickActions}
      currentStore={EProjectStore.PROFILE}
    />
  );
});

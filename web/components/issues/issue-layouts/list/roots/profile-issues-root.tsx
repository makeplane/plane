import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ProjectIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
import { EIssueActions } from "../../types";
// constants
import { BaseListRoot } from "../base-list-root";
import { IProjectStore } from "store/project";
import { EProjectStore } from "store/command-palette.store";

export const ProfileIssuesListLayout: FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, userId } = router.query as { workspaceSlug: string; userId: string };

  // store
  const { workspaceProfileIssuesFilter: profileIssueFiltersStore, workspaceProfileIssues: profileIssuesStore } =
    useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: async (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !userId) return;

      await profileIssuesStore.updateIssue(workspaceSlug, userId, issue.id, issue);
    },
    [EIssueActions.DELETE]: async (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !userId) return;

      await profileIssuesStore.removeIssue(workspaceSlug, userId, issue.project, issue.id);
    },
  };

  const getProjects = (projectStore: IProjectStore) => projectStore.workspaceProjects;

  return (
    <BaseListRoot
      issueFilterStore={profileIssueFiltersStore}
      issueStore={profileIssuesStore}
      QuickActions={ProjectIssueQuickActions}
      issueActions={issueActions}
      getProjects={getProjects}
      currentStore={EProjectStore.PROFILE}
    />
  );
});

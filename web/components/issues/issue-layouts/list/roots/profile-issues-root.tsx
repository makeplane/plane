import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useUser } from "hooks/store";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ProjectIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
import { EIssueActions } from "../../types";
// constants
import { BaseListRoot } from "../base-list-root";
import { EProjectStore } from "store/application/command-palette.store";
import { EUserProjectRoles } from "constants/project";

export const ProfileIssuesListLayout: FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, userId } = router.query as { workspaceSlug: string; userId: string };
  // store hooks
  const { workspaceProfileIssuesFilter: profileIssueFiltersStore, workspaceProfileIssues: profileIssuesStore } =
    useMobxStore();
  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();

  const issueActions = {
    [EIssueActions.UPDATE]: async (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !userId) return;

      await profileIssuesStore.updateIssue(workspaceSlug, userId, issue.id, issue);
    },
    [EIssueActions.DELETE]: async (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !userId) return;

      await profileIssuesStore.removeIssue(workspaceSlug, issue.project, issue.id, userId);
    },
  };

  const canEditPropertiesBasedOnProject = (projectId: string) => {
    const currentProjectRole = currentWorkspaceAllProjectsRole && currentWorkspaceAllProjectsRole[projectId];

    return !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  };

  return (
    <BaseListRoot
      issueFilterStore={profileIssueFiltersStore}
      issueStore={profileIssuesStore}
      QuickActions={ProjectIssueQuickActions}
      issueActions={issueActions}
      currentStore={EProjectStore.PROFILE}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
    />
  );
});

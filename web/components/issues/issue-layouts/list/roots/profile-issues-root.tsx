import { FC, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { ProjectIssueQuickActions } from "components/issues";
import { EIssuesStoreType } from "constants/issue";
import { EUserProjectRoles } from "constants/project";
import { useIssues, useUser } from "hooks/store";
// components
// types
import { TIssue } from "@plane/types";
import { EIssueActions } from "../../types";
// constants
import { BaseListRoot } from "../base-list-root";

export const ProfileIssuesListLayout: FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, userId } = router.query as { workspaceSlug: string; userId: string };
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROFILE);

  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: TIssue) => {
        if (!workspaceSlug || !userId) return;

        await issues.updateIssue(workspaceSlug, issue.project_id, issue.id, issue, userId);
      },
      [EIssueActions.DELETE]: async (issue: TIssue) => {
        if (!workspaceSlug || !userId) return;

        await issues.removeIssue(workspaceSlug, issue.project_id, issue.id, userId);
      },
      [EIssueActions.ARCHIVE]: async (issue: TIssue) => {
        if (!workspaceSlug || !userId) return;

        await issues.archiveIssue(workspaceSlug, issue.project_id, issue.id, userId);
      },
    }),
    [issues, workspaceSlug, userId]
  );

  const canEditPropertiesBasedOnProject = (projectId: string) => {
    const currentProjectRole = currentWorkspaceAllProjectsRole && currentWorkspaceAllProjectsRole[projectId];

    return !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  };

  return (
    <BaseListRoot
      issuesFilter={issuesFilter}
      issues={issues}
      QuickActions={ProjectIssueQuickActions}
      issueActions={issueActions}
      storeType={EIssuesStoreType.PROFILE}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
    />
  );
});

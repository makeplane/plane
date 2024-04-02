import { FC } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { ProjectIssueQuickActions } from "@/components/issues";
import { EUserProjectRoles } from "@/constants/project";
import { useUser } from "@/hooks/store";
// components
// types
// constants
import { BaseListRoot } from "../base-list-root";

export const ProfileIssuesListLayout: FC = observer(() => {
  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();

  const canEditPropertiesBasedOnProject = (projectId: string) => {
    const currentProjectRole = currentWorkspaceAllProjectsRole && currentWorkspaceAllProjectsRole[projectId];

    return !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  };

  return (
    <BaseListRoot
      QuickActions={ProjectIssueQuickActions}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
    />
  );
});

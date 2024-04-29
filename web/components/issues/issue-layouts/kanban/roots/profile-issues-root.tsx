import { observer } from "mobx-react";
// hooks
import { ProjectIssueQuickActions } from "@/components/issues";
import { EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
import { useUser } from "@/hooks/store";
// components
// types
// constants
import { BaseKanBanRoot } from "../base-kanban-root";

export const ProfileIssuesKanBanLayout: React.FC = observer(() => {
  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();

  const canEditPropertiesBasedOnProject = (projectId: string) => {
    const currentProjectRole = currentWorkspaceAllProjectsRole && currentWorkspaceAllProjectsRole[projectId];

    return !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  };

  return (
    <BaseKanBanRoot
      showLoader
      QuickActions={ProjectIssueQuickActions}
      storeType={EIssuesStoreType.PROFILE}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
    />
  );
});

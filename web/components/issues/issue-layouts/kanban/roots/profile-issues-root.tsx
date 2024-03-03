import { observer } from "mobx-react-lite";
// hooks
import { useUser } from "hooks/store";
// components
import { ProjectIssueQuickActions } from "components/issues";
import { BaseKanBanRoot } from "../base-kanban-root";
import { EUserProjectRoles } from "constants/project";
import { EIssuesStoreType } from "constants/issue";

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
      showLoader={true}
      QuickActions={ProjectIssueQuickActions}
      storeType={EIssuesStoreType.PROFILE}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
    />
  );
});

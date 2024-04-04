import { observer } from "mobx-react-lite";
// hooks
import { ProjectIssueQuickActions } from "@/components/issues";
import { EUserProjectRoles } from "@/constants/project";
import { useApplication, useUser } from "@/hooks/store";
// components
// types
// constants
import { BaseKanBanRoot } from "../base-kanban-root";

export const ProfileIssuesKanBanLayout: React.FC = observer(() => {
  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();
  const {
    router: { profileViewId },
  } = useApplication();

  const canEditPropertiesBasedOnProject = (projectId: string) => {
    const currentProjectRole = currentWorkspaceAllProjectsRole && currentWorkspaceAllProjectsRole[projectId];

    return !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  };

  return (
    <BaseKanBanRoot
      QuickActions={ProjectIssueQuickActions}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
      viewId={profileViewId}
    />
  );
});

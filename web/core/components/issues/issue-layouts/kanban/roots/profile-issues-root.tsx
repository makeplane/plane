import { observer } from "mobx-react";
// hooks
import { useParams } from "next/navigation";
import { ProjectIssueQuickActions } from "@/components/issues";
import { EUserProjectRoles } from "@/constants/project";
import { useUser } from "@/hooks/store";
// components
// types
// constants
import { BaseKanBanRoot } from "../base-kanban-root";

export const ProfileIssuesKanBanLayout: React.FC = observer(() => {
  // router
  const { profileViewId } = useParams();
  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();

  const canEditPropertiesBasedOnProject = (projectId: string) => {
    const currentProjectRole = currentWorkspaceAllProjectsRole && currentWorkspaceAllProjectsRole[projectId];

    return !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  };

  return (
    <BaseKanBanRoot
      QuickActions={ProjectIssueQuickActions}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
      viewId={profileViewId?.toString()}
    />
  );
});

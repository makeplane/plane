import { observer } from "mobx-react";
// hooks
import { useParams } from "next/navigation";
import { ProjectIssueQuickActions } from "@/components/issues";
import { useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

// components
// types
// constants
import { BaseKanBanRoot } from "../base-kanban-root";

export const ProfileIssuesKanBanLayout: React.FC = observer(() => {
  // router
  const { workspaceSlug, profileViewId } = useParams();
  const { allowPermissions } = useUserPermissions();

  const canEditPropertiesBasedOnProject = (projectId: string) =>
    allowPermissions(
      [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
      EUserPermissionsLevel.PROJECT,
      workspaceSlug.toString(),
      projectId
    );

  return (
    <BaseKanBanRoot
      QuickActions={ProjectIssueQuickActions}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
      viewId={profileViewId?.toString()}
    />
  );
});

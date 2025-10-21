import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseKanBanRoot } from "../base-kanban-root";

export const ProfileIssuesKanBanLayout: React.FC = observer(() => {
  // router
  const { workspaceSlug, profileViewId } = useParams();
  const { allowPermissions } = useUserPermissions();

  const ws = workspaceSlug?.toString();
  const canEditPropertiesBasedOnProject = (projectId: string) => {
    if (!ws) return false;
    return allowPermissions(
      [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
      EUserPermissionsLevel.PROJECT,
      ws,
      projectId
    );
  };

  return (
    <BaseKanBanRoot
      QuickActions={ProjectIssueQuickActions}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
      viewId={profileViewId?.toString()}
    />
  );
});

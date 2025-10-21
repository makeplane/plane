import type { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseListRoot } from "../base-list-root";

export const ProfileIssuesListLayout: FC = observer(() => {
  // router
  const { workspaceSlug, profileViewId } = useParams();
  // store
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
    <BaseListRoot
      QuickActions={ProjectIssueQuickActions}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
      viewId={profileViewId?.toString()}
    />
  );
});

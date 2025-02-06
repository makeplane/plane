import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserProjectRoles, EUserPermissionsLevel } from "@plane/constants";
// components
import { ProjectIssueQuickActions } from "@/components/issues";
import { BaseListRoot } from "@/components/issues/issue-layouts/list/base-list-root";
// hooks
import { useUserPermissions } from "@/hooks/store";

export const TeamspaceViewListLayout: React.FC = observer(() => {
  // router
  const { workspaceSlug, viewId } = useParams();
  // hooks
  const { allowPermissions } = useUserPermissions();

  if (!workspaceSlug || !viewId) return null;

  const canEditPropertiesBasedOnProject = (projectId: string) =>
    allowPermissions(
      [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
      EUserPermissionsLevel.PROJECT,
      workspaceSlug.toString(),
      projectId
    );

  return (
    <BaseListRoot
      QuickActions={ProjectIssueQuickActions}
      viewId={viewId.toString()}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
    />
  );
});

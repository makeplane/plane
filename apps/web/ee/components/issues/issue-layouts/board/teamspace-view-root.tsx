import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserProjectRoles } from "@plane/types";
// components
import { ProjectIssueQuickActions } from "@/components/issues";
import { BaseKanBanRoot } from "@/components/issues/issue-layouts/kanban/base-kanban-root";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane web constants

export const TeamspaceViewBoardLayout: React.FC = observer(() => {
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
    <BaseKanBanRoot
      QuickActions={ProjectIssueQuickActions}
      viewId={viewId.toString()}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
    />
  );
});

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserProjectRoles } from "@plane/types";
// components
import { ProjectIssueQuickActions } from "@/components/issues";
import { BaseCalendarRoot } from "@/components/issues/issue-layouts/calendar/base-calendar-root";
// hooks
import { useUserPermissions } from "@/hooks/store";

export const TeamspaceViewCalendarLayout: React.FC = observer(() => {
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
    <BaseCalendarRoot
      QuickActions={ProjectIssueQuickActions}
      viewId={viewId.toString()}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
    />
  );
});

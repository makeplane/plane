import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// component
import { ProjectIssueQuickActions } from "@/components/issues";
import { BaseCalendarRoot } from "@/components/issues/issue-layouts/calendar/base-calendar-root";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

export const TeamspaceViewCalendarLayout: React.FC = observer(() => {
  // router
  const { workspaceSlug, viewId } = useParams();
  // hooks
  const { allowPermissions } = useUserPermissions();

  if (!workspaceSlug || !viewId) return null;

  const canEditPropertiesBasedOnProject = (projectId: string) =>
    allowPermissions(
      [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
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

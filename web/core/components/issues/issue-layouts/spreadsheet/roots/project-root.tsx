import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { ProjectIssueQuickActions } from "@/components/issues";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane web constants
// local components
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";

export const ProjectSpreadsheetLayout: React.FC = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const { allowPermissions } = useUserPermissions();
  // derived values
  const canEditPropertiesBasedOnProject = (projectId: string) =>
    allowPermissions(
      [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
      EUserPermissionsLevel.PROJECT,
      workspaceSlug?.toString(),
      projectId
    );

  return (
    <BaseSpreadsheetRoot
      QuickActions={ProjectIssueQuickActions}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
    />
  );
});

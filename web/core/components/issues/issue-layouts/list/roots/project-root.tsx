import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { ProjectIssueQuickActions } from "@/components/issues";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane web constants
// components
import { BaseListRoot } from "../base-list-root";

export const ListLayout: FC = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const { allowPermissions } = useUserPermissions();

  if (!workspaceSlug) return null;

  const canEditPropertiesBasedOnProject = (projectId: string) =>
    allowPermissions(
      [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
      EUserPermissionsLevel.PROJECT,
      workspaceSlug.toString(),
      projectId
    );

  return (
    <BaseListRoot
      QuickActions={ProjectIssueQuickActions}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
    />
  );
});

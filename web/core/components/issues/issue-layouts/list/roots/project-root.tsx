import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { ProjectIssueQuickActions } from "@/components/issues";
// components
// types
// constants
import { useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
import { BaseListRoot } from "../base-list-root";

export const ListLayout: FC = observer(() => {
  const { workspaceSlug, projectId } = useParams();
  const { allowPermissions } = useUserPermissions();

  if (!workspaceSlug || !projectId) return null;

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

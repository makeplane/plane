import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { BaseListRoot } from "@/components/issues/issue-layouts/list/base-list-root";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane-web
import { ProjectEpicQuickActions } from "@/plane-web/components/epics";
// constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

export const EpicListLayout: FC = observer(() => {
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
      QuickActions={ProjectEpicQuickActions}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
      isEpic
    />
  );
});

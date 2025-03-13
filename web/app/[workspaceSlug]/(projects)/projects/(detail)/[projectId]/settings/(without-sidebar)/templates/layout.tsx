"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
// plane imports
import { EUserPermissionsLevel, EUserProjectRoles } from "@plane/constants";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
// hooks
import { useUserPermissions } from "@/hooks/store";

export type TProjectLevelTemplatesLayout = {
  children: ReactNode;
};

const ProjectLevelTemplatesLayout: FC<TProjectLevelTemplatesLayout> = observer((props) => {
  const { children } = props;
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  // derived values
  const hasAdminPermission = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);

  if (workspaceUserInfo && !hasAdminPermission) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return <>{children}</>;
});

export default ProjectLevelTemplatesLayout;

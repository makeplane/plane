"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
// constants
import { WORKSPACE_SETTINGS_ACCESS } from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { SettingsMobileNav } from "@/components/settings";
import { getWorkspaceActivePath, pathnameToAccessKey } from "@/components/settings/helper";
// hooks
import { useUserPermissions } from "@/hooks/store";
// local components
import { WorkspaceSettingsSidebar } from "./sidebar";

export interface IWorkspaceSettingLayout {
  children: ReactNode;
}

const WorkspaceSettingLayout: FC<IWorkspaceSettingLayout> = observer((props) => {
  const { children } = props;
  // store hooks
  const { workspaceUserInfo, getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  // next hooks
  const pathname = usePathname();
  // derived values
  const { workspaceSlug, accessKey } = pathnameToAccessKey(pathname);
  const userWorkspaceRole = getWorkspaceRoleByWorkspaceSlug(workspaceSlug.toString());

  let isAuthorized: boolean | string = false;
  if (pathname && workspaceSlug && userWorkspaceRole) {
    isAuthorized = WORKSPACE_SETTINGS_ACCESS[accessKey]?.includes(userWorkspaceRole as EUserWorkspaceRoles);
  }

  return (
    <>
      <SettingsMobileNav
        hamburgerContent={WorkspaceSettingsSidebar}
        activePath={getWorkspaceActivePath(pathname) || ""}
      />
      <div className="inset-y-0 flex flex-row w-full h-full">
        {workspaceUserInfo && !isAuthorized ? (
          <NotAuthorizedView section="settings" className="h-auto" />
        ) : (
          <div className="relative flex h-full w-full">
            <div className="hidden md:block">{<WorkspaceSettingsSidebar />}</div>
            <div className="w-full h-full overflow-y-scroll md:pt-page-y">{children}</div>
          </div>
        )}
      </div>
    </>
  );
});

export default WorkspaceSettingLayout;

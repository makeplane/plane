"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
// components
import { usePathname } from "next/navigation";
import { EUserWorkspaceRoles, WORKSPACE_SETTINGS_ACCESS } from "@plane/constants";
// hooks
import { NotAuthorizedView } from "@/components/auth-screens";
import { CommandPalette } from "@/components/command-palette";
import { SettingsMobileNav } from "@/components/settings";
import { getWorkspaceActivePath, pathnameToAccessKey } from "@/components/settings/helper";
import { useUserPermissions } from "@/hooks/store";
// local components
import { WorkspaceSettingsSidebar } from "./sidebar";

export interface IWorkspaceSettingLayout {
  children: ReactNode;
}

const WorkspaceSettingLayout: FC<IWorkspaceSettingLayout> = observer((props) => {
  const { children } = props;
  // store hooks
  const { workspaceUserInfo } = useUserPermissions();
  // next hooks
  const pathname = usePathname();
  // derived values
  const { workspaceSlug, accessKey } = pathnameToAccessKey(pathname);
  const userWorkspaceRole = workspaceUserInfo?.[workspaceSlug.toString()]?.role;

  const isAuthorized: boolean | string =
    pathname &&
    workspaceSlug &&
    userWorkspaceRole &&
    WORKSPACE_SETTINGS_ACCESS[accessKey]?.includes(userWorkspaceRole as EUserWorkspaceRoles);

  return (
    <>
      <CommandPalette />
      <SettingsMobileNav
        hamburgerContent={WorkspaceSettingsSidebar}
        activePath={getWorkspaceActivePath(pathname) || ""}
      />
      <div className="inset-y-0 flex flex-row vertical-scrollbar scrollbar-lg h-full w-full overflow-y-auto">
        {workspaceUserInfo && !isAuthorized ? (
          <NotAuthorizedView section="settings" className="h-auto" />
        ) : (
          <>
            <div className="flex-shrink-0 overflow-y-hidden sm:hidden hidden md:block lg:block">
              <WorkspaceSettingsSidebar />
            </div>
            {children}
          </>
        )}
      </div>
    </>
  );
});

export default WorkspaceSettingLayout;

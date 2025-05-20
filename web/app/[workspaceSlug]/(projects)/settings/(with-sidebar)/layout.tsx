"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
// plane imports
import { EUserWorkspaceRoles, WORKSPACE_SETTINGS_ACCESS } from "@plane/constants";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { AppHeader } from "@/components/core";
// hooks
import { useUserPermissions } from "@/hooks/store";
// local imports
import { WorkspaceSettingHeader } from "../header";
import { MobileWorkspaceSettingsTabs } from "./mobile-header-tabs";
import { WorkspaceSettingsSidebar } from "./sidebar";

export interface IWorkspaceSettingLayout {
  children: ReactNode;
}

const WorkspaceSettingLayout: FC<IWorkspaceSettingLayout> = observer((props) => {
  const { children } = props;
  // router
  const pathname = usePathname();
  const [workspaceSlug, suffix, route] = pathname.replace(/^\/|\/$/g, "").split("/"); // Regex removes leading and trailing slashes
  // store hooks
  const { workspaceUserInfo, getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  // derived values
  const userWorkspaceRole = getWorkspaceRoleByWorkspaceSlug(workspaceSlug.toString());
  const isAuthorized =
    pathname &&
    workspaceSlug &&
    userWorkspaceRole &&
    WORKSPACE_SETTINGS_ACCESS[route ? `/${suffix}/${route}` : `/${suffix}`]?.includes(
      userWorkspaceRole as EUserWorkspaceRoles
    );

  return (
    <>
      <AppHeader header={<WorkspaceSettingHeader />} />
      <MobileWorkspaceSettingsTabs />
      <div className="inset-y-0 flex flex-row vertical-scrollbar scrollbar-lg h-full w-full overflow-y-auto">
        {workspaceUserInfo && !isAuthorized ? (
          <NotAuthorizedView section="settings" />
        ) : (
          <>
            <div className="px-page-x !pr-0 py-page-y flex-shrink-0 overflow-y-hidden sm:hidden hidden md:block lg:block">
              <WorkspaceSettingsSidebar />
            </div>
            <div className="flex flex-col relative w-full overflow-hidden">
              <div className="w-full  h-full overflow-x-hidden overflow-y-scroll vertical-scrollbar scrollbar-md px-page-x md:px-9 py-page-y">
                {children}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
});

export default WorkspaceSettingLayout;

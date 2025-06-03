"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
// components
import { useParams, usePathname } from "next/navigation";
import { EUserWorkspaceRoles, WORKSPACE_SETTINGS_ACCESS } from "@plane/constants";
import { NotAuthorizedView } from "@/components/auth-screens";
import { AppHeader } from "@/components/core";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane web components
import { LicenseSeatsBanner } from "@/plane-web/components/license";
// local components
import { WorkspaceSettingHeader } from "../header";
import { MobileWorkspaceSettingsTabs } from "./mobile-header-tabs";
import { WorkspaceSettingsSidebar } from "./sidebar";

export interface IWorkspaceSettingLayout {
  children: ReactNode;
}

const WorkspaceSettingLayout: FC<IWorkspaceSettingLayout> = observer((props) => {
  const { children } = props;
  // navigation
  const pathname = usePathname();
  const [workspaceSlug, suffix, route] = pathname.replace(/^\/|\/$/g, "").split("/"); // Regex removes leading and trailing slashes
  // store hooks
  const { workspaceUserInfo } = useUserPermissions();
  // derived values
  const userWorkspaceRole = workspaceUserInfo?.[workspaceSlug.toString()]?.role;
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
      <div className="flex flex-col w-full h-full overflow-hidden">
        {/* free banner */}
        <LicenseSeatsBanner />
        {/* workspace settings */}
        <div className="w-full h-full overflow-hidden">
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
                  <div className="w-full h-full overflow-x-hidden overflow-y-scroll vertical-scrollbar scrollbar-md px-page-x md:px-9 py-page-y">
                    {children}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
});

export default WorkspaceSettingLayout;

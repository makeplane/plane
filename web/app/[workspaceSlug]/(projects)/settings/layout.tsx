"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
// components
// plane web components
// import { LicenseSeatsBanner } from "@/plane-web/components/license";
// local components
import { NotAuthorizedView } from "@/components/auth-screens";
import { AppHeader } from "@/components/core";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
import { WorkspaceSettingHeader } from "./header";
import { MobileWorkspaceSettingsTabs } from "./mobile-header-tabs";
import { WorkspaceSettingsSidebar } from "./sidebar";

export interface IWorkspaceSettingLayout {
  children: ReactNode;
}

const WorkspaceSettingLayout: FC<IWorkspaceSettingLayout> = observer((props) => {
  const { children } = props;

  const { workspaceUserInfo, allowPermissions } = useUserPermissions();

  // derived values
  const isWorkspaceAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  return (
    <>
      <AppHeader header={<WorkspaceSettingHeader />} />
      <div className="w-full h-full overflow-hidden">
        {/* free banner */}
        <div className="flex-shrink-0">{/* <LicenseSeatsBanner /> */}</div>
        {/* workspace settings */}
        <div className="w-full h-full overflow-hidden">
          <MobileWorkspaceSettingsTabs />
          <div className="inset-y-0 flex flex-row vertical-scrollbar scrollbar-lg h-full w-full overflow-y-auto">
            {workspaceUserInfo && !isWorkspaceAdmin ? (
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

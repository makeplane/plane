"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { AppHeader } from "@/components/core";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane web imports
import { LicenseSeatsBanner } from "@/plane-web/components/license";
// local components
import { WorkspaceSettingHeader } from "../header";

export interface IWorkspaceEntityCreationLayout {
  children: ReactNode;
}

const WorkspaceEntityCreationLayout: FC<IWorkspaceEntityCreationLayout> = observer((props) => {
  const { children } = props;

  const { workspaceUserInfo, allowPermissions } = useUserPermissions();

  // derived values
  const isWorkspaceAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  return (
    <>
      <AppHeader header={<WorkspaceSettingHeader />} />
      <div className="flex flex-col w-full h-full overflow-hidden">
        {/* free banner */}
        <LicenseSeatsBanner />
        {/* workspace settings */}
        <div className="w-full h-full overflow-hidden">
          <div className="inset-y-0 flex flex-row vertical-scrollbar scrollbar-lg h-full w-full overflow-y-auto">
            {workspaceUserInfo && !isWorkspaceAdmin ? (
              <NotAuthorizedView section="settings" />
            ) : (
              <div className="flex flex-col relative w-full overflow-hidden">
                <div className="size-full overflow-x-hidden overflow-y-scroll vertical-scrollbar scrollbar-md">
                  {children}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});

export default WorkspaceEntityCreationLayout;

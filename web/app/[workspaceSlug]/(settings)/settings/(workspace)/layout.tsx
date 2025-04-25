"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
// components
import { usePathname } from "next/navigation";
import { EUserWorkspaceRoles, WORKSPACE_SETTINGS_ACCESS } from "@plane/constants";
// hooks
import { NotAuthorizedView } from "@/components/auth-screens";
import { SettingsContentWrapper } from "@/components/settings";
import { useUserPermissions } from "@/hooks/store";
// local components
import { MobileWorkspaceSettingsTabs } from "./mobile-header-tabs";
import { WorkspaceSettingsSidebar } from "./sidebar";

export interface IWorkspaceSettingLayout {
  children: ReactNode;
}

const pathnameToAccessKey = (pathname: string) => {
  const pathArray = pathname.replace(/^\/|\/$/g, "").split("/"); // Regex removes leading and trailing slashes
  const workspaceSlug = pathArray[0];
  const accessKey = pathArray.slice(1, 3).join("/");
  return { workspaceSlug, accessKey: `/${accessKey}` || "" };
};

const WorkspaceSettingLayout: FC<IWorkspaceSettingLayout> = observer((props) => {
  const { children } = props;
  // store hooks
  const { workspaceUserInfo } = useUserPermissions();
  // next hooks
  const pathname = usePathname();
  // derived values
  const { workspaceSlug, accessKey } = pathnameToAccessKey(pathname);
  const userWorkspaceRole = workspaceUserInfo?.[workspaceSlug.toString()]?.role;

  const isAuthorized =
    pathname &&
    workspaceSlug &&
    userWorkspaceRole &&
    WORKSPACE_SETTINGS_ACCESS[accessKey]?.includes(userWorkspaceRole as EUserWorkspaceRoles);

  return (
    <>
      <MobileWorkspaceSettingsTabs />
      <div className="inset-y-0 flex flex-row vertical-scrollbar scrollbar-lg h-full w-full overflow-y-auto">
        {workspaceUserInfo && !isAuthorized ? (
          <NotAuthorizedView section="settings" />
        ) : (
          <>
            <div className="flex-shrink-0 overflow-y-hidden sm:hidden hidden md:block lg:block">
              <WorkspaceSettingsSidebar workspaceSlug={workspaceSlug} pathname={pathname} />
            </div>
            <SettingsContentWrapper>{children}</SettingsContentWrapper>
          </>
        )}
      </div>
    </>
  );
});

export default WorkspaceSettingLayout;

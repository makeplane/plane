"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
// components
import { usePathname } from "next/navigation";
import {
  EUserPermissionsLevel,
  EUserWorkspaceRoles,
  GROUPED_WORKSPACE_SETTINGS,
  WORKSPACE_SETTINGS_ACCESS,
  WORKSPACE_SETTINGS_CATEGORIES,
} from "@plane/constants";
// hooks
import { NotAuthorizedView } from "@/components/auth-screens";
import SettingsSidebar from "@/components/settings/sidebar";
import { useUserPermissions } from "@/hooks/store";
// plane web constants
// local components
import { shouldRenderSettingLink } from "@/plane-web/helpers/workspace.helper";
import { MobileWorkspaceSettingsTabs } from "./mobile-header-tabs";

export interface IWorkspaceSettingLayout {
  children: ReactNode;
}

const pathnameToAccessKey = (pathname: string) => {
  const pathArray = pathname.replace(/^\/|\/$/g, "").split("/"); // Regex removes leading and trailing slashes
  const workspaceSlug = pathArray[0];
  const accessKey = pathArray.slice(1).join("/");
  return { workspaceSlug, accessKey: `/${accessKey}` || "" };
};

const WorkspaceSettingLayout: FC<IWorkspaceSettingLayout> = observer((props) => {
  const { children } = props;
  // store hooks
  const { workspaceUserInfo } = useUserPermissions();
  const { allowPermissions } = useUserPermissions();
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
            <div className="px-12 !pr-0 py-page-y flex-shrink-0 overflow-y-hidden sm:hidden hidden md:block lg:block">
              <SettingsSidebar
                categories={WORKSPACE_SETTINGS_CATEGORIES}
                groupedSettings={GROUPED_WORKSPACE_SETTINGS}
                workspaceSlug={workspaceSlug.toString()}
                isActive={(data: { href: string }) => pathname === `/${workspaceSlug}${data.href}/`}
                shouldRender={(data: { key: string; access: EUserWorkspaceRoles[] }) =>
                  shouldRenderSettingLink(workspaceSlug.toString(), data.key) &&
                  allowPermissions(data.access, EUserPermissionsLevel.WORKSPACE, workspaceSlug.toString())
                }
              />
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

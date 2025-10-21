"use client";

import type { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import type { Route } from "./+types/layout";
// constants
import { WORKSPACE_SETTINGS_ACCESS } from "@plane/constants";
import type { EUserWorkspaceRoles } from "@plane/types";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { getWorkspaceActivePath, pathnameToAccessKey } from "@/components/settings/helper";
import { SettingsMobileNav } from "@/components/settings/mobile";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// local components
import { WorkspaceSettingsSidebar } from "./sidebar";

type Props = Route.ComponentProps & { children: ReactNode };

const WorkspaceSettingLayout: FC<Props> = observer(({ children, params }) => {
  const { workspaceSlug } = params;
  // store hooks
  const { workspaceUserInfo, getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  // next hooks
  const pathname = usePathname();
  // derived values
  const { accessKey } = pathnameToAccessKey(pathname);
  const userWorkspaceRole = getWorkspaceRoleByWorkspaceSlug(workspaceSlug);

  let isAuthorized: boolean | string = false;
  if (pathname && workspaceSlug && userWorkspaceRole) {
    isAuthorized = WORKSPACE_SETTINGS_ACCESS[accessKey]?.includes(userWorkspaceRole as EUserWorkspaceRoles);
  }

  return (
    <>
      <SettingsMobileNav
        hamburgerContent={(props) => <WorkspaceSettingsSidebar {...props} workspaceSlug={workspaceSlug} />}
        activePath={getWorkspaceActivePath(pathname) || ""}
      />
      <div className="inset-y-0 flex flex-row w-full h-full">
        {workspaceUserInfo && !isAuthorized ? (
          <NotAuthorizedView section="settings" className="h-auto" />
        ) : (
          <div className="relative flex h-full w-full">
            <div className="hidden md:block">{<WorkspaceSettingsSidebar workspaceSlug={workspaceSlug} />}</div>
            <div className="w-full h-full overflow-y-scroll md:pt-page-y">{children}</div>
          </div>
        )}
      </div>
    </>
  );
});

export default WorkspaceSettingLayout;

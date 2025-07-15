"use client";

import { observer } from "mobx-react";
// hooks
import { useAppRail } from "@/hooks/use-app-rail";
// components
import { WorkspaceAppSwitcher } from "@/plane-web/components/workspace/app-switcher";
import { UserMenuRoot } from "./user-menu-root";
import { WorkspaceMenuRoot } from "./workspace-menu-root";

export const SidebarDropdown = observer(() => {
  // hooks
  const { shouldRenderAppRail, isEnabled: isAppRailEnabled } = useAppRail();

  return (
    <div className="flex items-center justify-center gap-1.5 w-full">
      <WorkspaceMenuRoot />
      {isAppRailEnabled && !shouldRenderAppRail && <WorkspaceAppSwitcher />}
      <UserMenuRoot />
    </div>
  );
});

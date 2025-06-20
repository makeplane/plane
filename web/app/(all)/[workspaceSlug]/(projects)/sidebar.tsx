import { FC, useEffect, useRef } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
// plane helpers
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useOutsideClickDetector } from "@plane/hooks";
// components
import { cn } from "@plane/utils";
import { SidebarDropdown, SidebarHelpSection, SidebarProjectsList, SidebarQuickActions } from "@/components/workspace";
import { SidebarFavoritesMenu } from "@/components/workspace/sidebar/favorites/favorites-menu";
import { SidebarMenuItems } from "@/components/workspace/sidebar/sidebar-menu-items";
// hooks
import { useAppTheme, useUserPermissions } from "@/hooks/store";
import { useFavorite } from "@/hooks/store/use-favorite";
import useSize from "@/hooks/use-window-size";
// plane web components
import { SidebarAppSwitcher } from "@/plane-web/components/sidebar";
import { SidebarTeamsList } from "@/plane-web/components/workspace/sidebar/teams-sidebar-list";

export const AppSidebar: FC = observer(() => {
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { toggleSidebar, sidebarCollapsed } = useAppTheme();
  const { groupedFavorites } = useFavorite();
  const windowSize = useSize();
  // refs
  const ref = useRef<HTMLDivElement>(null);

  // derived values
  const canPerformWorkspaceMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  useOutsideClickDetector(ref, () => {
    if (sidebarCollapsed === false) {
      if (window.innerWidth < 768) {
        toggleSidebar();
      }
    }
  });

  useEffect(() => {
    if (windowSize[0] < 768 && !sidebarCollapsed) toggleSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowSize]);

  const isFavoriteEmpty = isEmpty(groupedFavorites);

  return (
    <>
      <div className="px-4">
        {/* Workspace switcher and settings */}
        <SidebarDropdown />
        <div className="flex-shrink-0 h-4" />
        {/* App switcher */}
        {canPerformWorkspaceMemberActions && <SidebarAppSwitcher />}
        {/* Quick actions */}
        <SidebarQuickActions />
      </div>
      <div className="flex flex-col gap-1 overflow-x-hidden scrollbar-sm h-full w-full overflow-y-auto pt-3 pb-0.5 vertical-scrollbar px-4">
        <SidebarMenuItems />
        {/* Favorites Menu */}
        {canPerformWorkspaceMemberActions && !isFavoriteEmpty && <SidebarFavoritesMenu />}
        {/* Teams List */}
        <SidebarTeamsList />
        {/* Projects List */}
        <SidebarProjectsList />
      </div>
      {/* Help Section */}
      <SidebarHelpSection />
    </>
  );
});

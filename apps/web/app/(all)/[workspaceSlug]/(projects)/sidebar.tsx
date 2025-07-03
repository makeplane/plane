import { FC, useEffect, useRef } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
// plane helpers
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useOutsideClickDetector } from "@plane/hooks";
// components
import { AppSidebarToggleButton } from "@/components/sidebar";
import { SidebarDropdown, SidebarProjectsList, SidebarQuickActions } from "@/components/workspace";
import { SidebarFavoritesMenu } from "@/components/workspace/sidebar/favorites/favorites-menu";
import { HelpMenu } from "@/components/workspace/sidebar/help-menu";
import { SidebarMenuItems } from "@/components/workspace/sidebar/sidebar-menu-items";
// hooks
import { useAppTheme, useUserPermissions } from "@/hooks/store";
import { useFavorite } from "@/hooks/store/use-favorite";
import { useAppRail } from "@/hooks/use-app-rail";
import useSize from "@/hooks/use-window-size";
// plane web components
import { WorkspaceEditionBadge } from "@/plane-web/components/workspace/edition-badge";
import { SidebarTeamsList } from "@/plane-web/components/workspace/sidebar/teams-sidebar-list";

export const AppSidebar: FC = observer(() => {
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { toggleSidebar, sidebarCollapsed } = useAppTheme();
  const { shouldRenderAppRail, isEnabled: isAppRailEnabled } = useAppRail();
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
      <div className="flex flex-col gap-3 px-3">
        {/* Workspace switcher and settings */}
        {!shouldRenderAppRail && <SidebarDropdown />}

        {isAppRailEnabled && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-md text-custom-text-200 font-medium pt-1">Projects</span>
            <div className="flex items-center gap-2">
              <AppSidebarToggleButton />
            </div>
          </div>
        )}
        {/* Quick actions */}
        <SidebarQuickActions />
      </div>
      <div className="flex flex-col gap-3 overflow-x-hidden scrollbar-sm h-full w-full overflow-y-auto vertical-scrollbar px-3 pt-3 pb-0.5">
        <SidebarMenuItems />
        {/* Favorites Menu */}
        {canPerformWorkspaceMemberActions && !isFavoriteEmpty && <SidebarFavoritesMenu />}
        {/* Teams List */}
        <SidebarTeamsList />
        {/* Projects List */}
        <SidebarProjectsList />
      </div>
      {/* Help Section */}
      <div className="flex items-center justify-between p-3 border-t border-custom-border-200 bg-custom-sidebar-background-100 h-12">
        <WorkspaceEditionBadge />
        <div className="flex items-center gap-2">
          {!shouldRenderAppRail && <HelpMenu />}
          {!isAppRailEnabled && <AppSidebarToggleButton />}
        </div>
      </div>
    </>
  );
});

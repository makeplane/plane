import { FC, useEffect, useRef } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { PanelLeft } from "lucide-react";
// plane helpers
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useOutsideClickDetector } from "@plane/hooks";
// components
import { SidebarDropdown, SidebarProjectsList, SidebarQuickActions } from "@/components/workspace";
import { SidebarFavoritesMenu } from "@/components/workspace/sidebar/favorites/favorites-menu";
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
  const { toggleSidebar, sidebarCollapsed, sidebarPeek, toggleSidebarPeek } = useAppTheme();
  const { shouldRenderAppRail } = useAppRail();
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
      <div className="flex flex-col gap-2 px-4">
        {/* Workspace switcher and settings */}
        {!shouldRenderAppRail && <SidebarDropdown />}

        <div className="flex items-center justify-between gap-2">
          <span className="text-md text-custom-text-200 font-medium px-1 pt-1">Projects</span>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center justify-center size-6 rounded text-custom-text-200 hover:text-custom-primary-100 hover:bg-custom-background-90"
              onClick={() => {
                if (sidebarPeek) toggleSidebarPeek(false);
                toggleSidebar();
              }}
            >
              <PanelLeft className="size-4" />
            </button>
          </div>
        </div>
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
      <div className="flex items-center justify-center p-2 border-t border-custom-border-200 bg-custom-sidebar-background-100 h-12">
        <WorkspaceEditionBadge />
      </div>
    </>
  );
});

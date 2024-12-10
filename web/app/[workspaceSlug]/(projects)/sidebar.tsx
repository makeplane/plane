import { FC, useEffect, useRef } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
// components
import {
  SidebarDropdown,
  SidebarHelpSection,
  SidebarProjectsList,
  SidebarQuickActions,
  SidebarUserMenu,
  SidebarWorkspaceMenu,
} from "@/components/workspace";
// helpers
import { SidebarFavoritesMenu } from "@/components/workspace/sidebar/favorites/favorites-menu";
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme, useUserPermissions } from "@/hooks/store";
import { useFavorite } from "@/hooks/store/use-favorite";
import useSize from "@/hooks/use-window-size";
// plane web components
import { SidebarAppSwitcher } from "@/plane-web/components/sidebar";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

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
    if (windowSize[0] < 768) !sidebarCollapsed && toggleSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowSize]);

  const isFavoriteEmpty = isEmpty(groupedFavorites);

  return (
    <div
      className={cn(
        "fixed inset-y-0 z-20 flex h-full flex-shrink-0 flex-grow-0 flex-col border-r border-custom-sidebar-border-200 bg-custom-sidebar-background-100 duration-300 w-[250px] md:relative md:ml-0",
        {
          "w-[70px] -ml-[250px]": sidebarCollapsed,
        }
      )}
    >
      <div
        ref={ref}
        className={cn("size-full flex flex-col flex-1 pt-4 pb-0", {
          "p-2 pt-4": sidebarCollapsed,
        })}
      >
        <div
          className={cn("px-2", {
            "px-4": !sidebarCollapsed,
          })}
        >
          <SidebarDropdown />
          <div className="flex-shrink-0 h-4" />
          <SidebarAppSwitcher />
          <SidebarQuickActions />
        </div>
        <hr
          className={cn("flex-shrink-0 border-custom-sidebar-border-300 h-[0.5px] w-3/5 mx-auto my-1", {
            "opacity-0": !sidebarCollapsed,
          })}
        />
        <div
          className={cn("overflow-x-hidden scrollbar-sm h-full w-full overflow-y-auto px-2 py-0.5", {
            "vertical-scrollbar px-4": !sidebarCollapsed,
          })}
        >
          <SidebarUserMenu />

          <SidebarWorkspaceMenu />
          <hr
            className={cn("flex-shrink-0 border-custom-sidebar-border-300 h-[0.5px] w-3/5 mx-auto my-1", {
              "opacity-0": !sidebarCollapsed,
            })}
          />
          {canPerformWorkspaceMemberActions && !isFavoriteEmpty && <SidebarFavoritesMenu />}

          <SidebarProjectsList />
        </div>
        <SidebarHelpSection />
      </div>
    </div>
  );
});

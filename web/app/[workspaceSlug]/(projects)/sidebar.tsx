import { FC, useEffect, useRef } from "react";
import { observer } from "mobx-react";
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
import { useAppTheme, useUser } from "@/hooks/store";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";
// plane web components
import useSize from "@/hooks/use-window-size";
import { SidebarAppSwitcher } from "@/plane-web/components/sidebar";

export interface IAppSidebar {}

export const AppSidebar: FC<IAppSidebar> = observer(() => {
  // store hooks
  const { canPerformWorkspaceMemberActions } = useUser();
  const { toggleSidebar, sidebarCollapsed } = useAppTheme();
  const windowSize = useSize();
  // refs
  const ref = useRef<HTMLDivElement>(null);

  useOutsideClickDetector(ref, () => {
    if (sidebarCollapsed === false) {
      if (window.innerWidth < 768) {
        toggleSidebar();
      }
    }
  });

  useEffect(() => {
    if (windowSize[0] < 768) !sidebarCollapsed && toggleSidebar();
    else sidebarCollapsed && toggleSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowSize]);

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
          className={cn("overflow-x-hidden scrollbar-sm h-full w-full overflow-y-auto px-2", {
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
          {canPerformWorkspaceMemberActions && <SidebarFavoritesMenu />}

          <SidebarProjectsList />
        </div>
        <SidebarHelpSection />
      </div>
    </div>
  );
});

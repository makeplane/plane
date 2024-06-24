import { FC, useRef } from "react";
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
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme } from "@/hooks/store";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";
// plane web components
import { SidebarAppSwitcher } from "@/plane-web/components/sidebar";

export interface IAppSidebar {}

export const AppSidebar: FC<IAppSidebar> = observer(() => {
  // store hooks
  const { toggleSidebar, sidebarCollapsed } = useAppTheme();
  // refs
  const ref = useRef<HTMLDivElement>(null);

  useOutsideClickDetector(ref, () => {
    if (sidebarCollapsed === false) {
      if (window.innerWidth < 768) {
        toggleSidebar();
      }
    }
  });

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
        className={cn("size-full flex flex-col flex-1 p-4 pb-0", {
          "p-2": sidebarCollapsed,
        })}
      >
        <div className="w-full pb-2">
          <SidebarDropdown />
        </div>
        <SidebarAppSwitcher />
        <div className="w-full py-2">
          <SidebarQuickActions />
        </div>
        {sidebarCollapsed && <hr className="border-custom-sidebar-border-200 h-[0.5px] w-3/5 mx-auto" />}
        <div className="w-full py-2">
          <SidebarUserMenu />
        </div>
        {sidebarCollapsed && <hr className="border-custom-sidebar-border-200 h-[0.5px] w-3/5 mx-auto" />}
        <div className="w-full py-2">
          <SidebarWorkspaceMenu />
        </div>
        {sidebarCollapsed && <hr className="border-custom-sidebar-border-200 h-[0.5px] w-3/5 mx-auto" />}
        <div className="size-full py-2">
          <SidebarProjectsList />
        </div>
        <div className="flex-shrink-0">
          <SidebarHelpSection />
        </div>
      </div>
    </div>
  );
});

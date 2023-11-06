import { FC, useEffect } from "react";
import { observer } from "mobx-react-lite";
// components
import {
  WorkspaceHelpSection,
  WorkspaceSidebarDropdown,
  WorkspaceSidebarMenu,
  WorkspaceSidebarQuickAction,
} from "components/workspace";
import { ProjectSidebarList } from "components/project";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { Menu } from "lucide-react";
import router from "next/router";

export interface IAppSidebar {}

export const AppSidebar: FC<IAppSidebar> = observer(() => {
  // store
  const { theme: themStore } = useMobxStore();

  useEffect(() => {
    router.events.on("routeChangeStart", () => {
      themStore.setShowSidebarOnMobile(false);
    });
    return () => {
      router.events.off("routeChangeStart", () => {
        themStore.setShowSidebarOnMobile(false);
      });
    };
  }, []);

  return (
    <div
      id="app-sidebar"
      className={`absolute  max-w-[300px] top-0 left-0 md:relative inset-y-0 md:flex flex-col bg-custom-sidebar-background-100 h-full flex-shrink-0 flex-grow-0 border-r border-custom-sidebar-border-200 z-20 md:translate-x-0 duration-300  ${
        themStore?.sidebarCollapsed ? "" : "md:w-[280px]"
      } ${themStore?.sidebarCollapsed ? "left-0" : "-left-full md:left-0"}
      ${themStore.showSidebarOnMobile ? "" : "transition-transform translate-x-[-300px] ease-linear"}
      `}
    >
      <div className="flex h-full w-full flex-1 flex-col">
        <div className="flex items-center ">
          <div className="pt-4 pl-4 md:hidden">
            <button
              className="grid h-7 w-7  place-items-center rounded border border-custom-border-200"
              onClick={() => {
                themStore.setShowSidebarOnMobile(false);
              }}
            >
              <Menu className="h-4 w-4 " fontSize={14} strokeWidth={2} />
            </button>
          </div>
          <div className="flex-1">
            <WorkspaceSidebarDropdown />
          </div>
        </div>
        <WorkspaceSidebarQuickAction />
        <WorkspaceSidebarMenu />
        <ProjectSidebarList />
        <WorkspaceHelpSection />
      </div>
    </div>
  );
});

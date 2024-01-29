import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import {
  WorkspaceHelpSection,
  WorkspaceSidebarDropdown,
  WorkspaceSidebarMenu,
  WorkspaceSidebarQuickAction,
} from "components/workspace";
import { ProjectSidebarList } from "components/project";
// hooks
import { useApplication } from "hooks/store";

export interface IAppSidebar {}

export const AppSidebar: FC<IAppSidebar> = observer(() => {
  // store hooks
  const { theme: themStore } = useApplication();

  return (
    <div
      className={`inset-y-0 z-20 flex h-full flex-shrink-0 flex-grow-0 flex-col border-r border-custom-sidebar-border-200 bg-custom-sidebar-background-100 duration-300
        fixed md:relative 
        -ml-[280px] ${themStore.sidebarCollapsed ? "w-[80px]" : "w-[280px]"} md:ml-[0px] 
      `}    >
      <div className="flex h-full w-full flex-1 flex-col">
        <WorkspaceSidebarDropdown />
        <WorkspaceSidebarQuickAction />
        <WorkspaceSidebarMenu />
        <ProjectSidebarList />
        <WorkspaceHelpSection />
      </div>
    </div>
  );
});

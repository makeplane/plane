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
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

export interface IAppSidebar {}

export const AppSidebar: FC<IAppSidebar> = observer(() => {
  // store
  const { theme: themStore } = useMobxStore();

  return (
    <div
      id="app-sidebar"
      className={`fixed md:relative inset-y-0 flex flex-col bg-custom-sidebar-background-100 h-full flex-shrink-0 flex-grow-0 border-r border-custom-sidebar-border-200 z-20 duration-300 ${
        themStore?.sidebarCollapsed ? "" : "md:w-[280px]"
      } ${themStore?.sidebarCollapsed ? "left-0" : "-left-full md:left-0"}`}
    >
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

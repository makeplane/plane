import React, { Dispatch, SetStateAction } from "react";
// hooks
import useTheme from "hooks/useTheme";
// components
import {
  WorkspaceHelpSection,
  WorkspaceSidebarDropdown,
  WorkspaceSidebarMenu,
} from "components/workspace";
import { ProjectSidebarList } from "components/project";

export interface SidebarProps {
  isSidebarActive: boolean;
  setSidebarActive: Dispatch<SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = (props) => {
  const { isSidebarActive, setSidebarActive } = props;
  // theme
  const { collapsed: sidebarCollapse } = useTheme();

  return (
    <nav className="relative z-20 h-screen">
      <div
        className={`${sidebarCollapse ? "" : "w-auto md:w-60"} fixed inset-y-0 top-0 ${
          isSidebarActive ? "left-0" : "-left-60 md:left-0"
        } flex h-full flex-col bg-white duration-300 md:relative`}
      >
        <div className="flex h-full flex-1 flex-col border-r border-gray-200">
          <div className="flex h-full flex-1 flex-col pt-2">
            <WorkspaceSidebarDropdown />
            <WorkspaceSidebarMenu />
            <ProjectSidebarList />
            <WorkspaceHelpSection setSidebarActive={setSidebarActive} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;

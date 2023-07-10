// hooks
import useTheme from "hooks/use-theme";
// components
import {
  WorkspaceHelpSection,
  WorkspaceSidebarDropdown,
  WorkspaceSidebarMenu,
} from "components/workspace";
import { ProjectSidebarList } from "components/project";

export interface SidebarProps {
  toggleSidebar: boolean;
  setToggleSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = ({ toggleSidebar, setToggleSidebar }) => {
  // theme
  const { collapsed: sidebarCollapse } = useTheme();

  return (
    <div
      className={`z-20 h-full flex-shrink-0 border-r border-custom-sidebar-border-100 ${
        sidebarCollapse ? "" : "w-auto md:w-[17rem]"
      } fixed inset-y-0 top-0 ${
        toggleSidebar ? "left-0" : "-left-full md:left-0"
      } flex h-full flex-col bg-custom-sidebar-background-100 duration-300 md:relative`}
    >
      <div className="flex h-full flex-1 flex-col">
        <WorkspaceSidebarDropdown />
        <WorkspaceSidebarMenu />
        <ProjectSidebarList />
        <WorkspaceHelpSection setSidebarActive={setToggleSidebar} />
      </div>
    </div>
  );
};

export default Sidebar;

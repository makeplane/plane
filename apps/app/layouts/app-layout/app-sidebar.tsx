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
    <nav className="relative z-20 h-screen">
      <div
        className={`${sidebarCollapse ? "" : "w-auto md:w-72"} fixed inset-y-0 top-0 ${
          toggleSidebar ? "left-0" : "-left-60 md:left-0"
        } flex h-full flex-col bg-white duration-300 md:relative`}
      >
        <div className="flex h-full flex-1 flex-col border-r">
          <div className="flex h-full flex-1 flex-col pt-2">
            <div className="px-2">
              <WorkspaceSidebarDropdown />
            </div>
            <WorkspaceSidebarMenu />
            <ProjectSidebarList />
            <WorkspaceHelpSection setSidebarActive={setToggleSidebar} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;

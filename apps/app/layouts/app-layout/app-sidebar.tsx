// hooks
import useTheme from "hooks/use-theme";
// components
import {
  WorkspaceHelpSection,
  WorkspaceSidebarDropdown,
  WorkspaceSidebarMenu,
  WorkspaceSidebarQuickAction,
} from "components/workspace";
import { ProjectSidebarList } from "components/project";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

export interface SidebarProps {
  toggleSidebar: boolean;
  setToggleSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = observer(({ toggleSidebar, setToggleSidebar }) => {
  const store: any = useMobxStore();
  // theme
  const { collapsed: sidebarCollapse } = useTheme();

  return (
    <div
      id="app-sidebar"
      className={`fixed md:relative inset-y-0 flex flex-col bg-custom-sidebar-background-100 h-full flex-shrink-0 flex-grow-0 border-r border-custom-sidebar-border-200 z-20 duration-300 ${
        store?.theme?.sidebarCollapsed ? "" : "md:w-[280px]"
      } ${toggleSidebar ? "left-0" : "-left-full md:left-0"}`}
    >
      <div className="flex h-full w-full flex-1 flex-col">
        <WorkspaceSidebarDropdown />
        <WorkspaceSidebarQuickAction />
        <WorkspaceSidebarMenu />
        <ProjectSidebarList />
        <WorkspaceHelpSection setSidebarActive={setToggleSidebar} />
      </div>
    </div>
  );
});

export default Sidebar;

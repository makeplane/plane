import { FC, useEffect, useRef } from "react";
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
import useOutsideClickDetector from "hooks/use-outside-click-detector";

export interface IAppSidebar { }

export const AppSidebar: FC<IAppSidebar> = observer(() => {
  // store hooks
  const { theme: themStore } = useApplication();
  const ref = useRef<HTMLDivElement>(null);

  useOutsideClickDetector(ref, () => {
    if (themStore.sidebarCollapsed === false) {
      if (window.innerWidth < 768) {
        themStore.toggleSidebar();
      }
    }
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        themStore.toggleSidebar(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [themStore]);

  return (
    <div
      className={`inset-y-0 z-20 flex h-full flex-shrink-0 flex-grow-0 flex-col border-r border-custom-sidebar-border-200 bg-custom-sidebar-background-100 duration-300
        fixed md:relative
        ${themStore.sidebarCollapsed ? "-ml-[280px]" : ""}
        sm:${themStore.sidebarCollapsed ? "-ml-[280px]" : ""}
        md:ml-0 ${themStore.sidebarCollapsed ? 'w-[80px]' : 'w-[280px]'}
        lg:ml-0 ${themStore.sidebarCollapsed ? 'w-[80px]' : 'w-[280px]'}
      `}    >
      <div
        ref={ref}
        className="flex h-full w-full flex-1 flex-col">
        <WorkspaceSidebarDropdown />
        <WorkspaceSidebarQuickAction />
        <WorkspaceSidebarMenu />
        <ProjectSidebarList />
        <WorkspaceHelpSection />
      </div>
    </div>
  );
});




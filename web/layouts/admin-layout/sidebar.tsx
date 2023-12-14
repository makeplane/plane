import { FC } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useApplication } from "hooks/store";
// components
import { InstanceAdminSidebarMenu, InstanceHelpSection, InstanceSidebarDropdown } from "components/instance";

export interface IInstanceAdminSidebar {}

export const InstanceAdminSidebar: FC<IInstanceAdminSidebar> = observer(() => {
  // store
  const {
    theme: { sidebarCollapsed },
  } = useApplication();

  return (
    <div
      className={`fixed inset-y-0 z-20 flex h-full flex-shrink-0 flex-grow-0 flex-col border-r border-custom-sidebar-border-200 bg-custom-sidebar-background-100 duration-300 md:relative ${
        sidebarCollapsed ? "" : "md:w-[280px]"
      } ${sidebarCollapsed ? "left-0" : "-left-full md:left-0"}`}
    >
      <div className="flex h-full w-full flex-1 flex-col">
        <InstanceSidebarDropdown />
        <InstanceAdminSidebarMenu />
        <InstanceHelpSection />
      </div>
    </div>
  );
});

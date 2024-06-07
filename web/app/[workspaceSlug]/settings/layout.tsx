"use client";

import { FC, ReactNode } from "react";
// components
import MobileWorkspaceSettingsTabs from "@/components/workspace/settings/mobile-workspace-settings-tabs";
// local components
import { WorkspaceSettingsSidebar } from "./sidebar";

export interface IWorkspaceSettingLayout {
  children: ReactNode;
}

const WorkspaceSettingLayout: FC<IWorkspaceSettingLayout> = (props) => {
  const { children } = props;

  return (
    <div className="inset-y-0 z-20 flex h-full w-full gap-2">
      <div className="w-80 flex-shrink-0 overflow-y-hidden pt-8 sm:hidden hidden md:block lg:block">
        <WorkspaceSettingsSidebar />
      </div>
      <div className="flex flex-col relative w-full overflow-hidden">
        <MobileWorkspaceSettingsTabs />
        <div className="w-full pl-4 md:pl-0 md:py-8 py-2 overflow-x-hidden overflow-y-scroll vertical-scrollbar scrollbar-md">
          {children}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSettingLayout;

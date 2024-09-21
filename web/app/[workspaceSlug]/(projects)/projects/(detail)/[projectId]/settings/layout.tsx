"use client";

import { FC, ReactNode } from "react";
// components
import { AppHeader } from "@/components/core";
// local components
import { ProjectSettingHeader } from "./header";
import { ProjectSettingsSidebar } from "./sidebar";

export interface IProjectSettingLayout {
  children: ReactNode;
}

const ProjectSettingLayout: FC<IProjectSettingLayout> = (props) => {
  const { children } = props;
  return (
    <>
      <AppHeader header={<ProjectSettingHeader />} />
      <div className="inset-y-0 flex flex-row vertical-scrollbar scrollbar-lg h-full w-full overflow-y-auto">
        <div className="px-page-x !pr-0 py-page-y flex-shrink-0 overflow-y-hidden sm:hidden hidden md:block lg:block">
          <ProjectSettingsSidebar />
        </div>
        <div className="flex flex-col relative w-full overflow-hidden">
          <div className="h-full w-full overflow-x-hidden overflow-y-scroll vertical-scrollbar scrollbar-md px-page-x md:px-9 py-page-y">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectSettingLayout;

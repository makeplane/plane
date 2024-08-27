"use client";

import { FC, ReactNode } from "react";
// components
import { AppHeader, ContentWrapper } from "@/components/core";
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
      <ContentWrapper>
        <div className="inset-y-0 z-20 flex flex-grow-0 h-full w-full">
          <div className="w-80 flex-shrink-0 overflow-y-hidden pt-8 sm:hidden hidden md:block lg:block">
            <ProjectSettingsSidebar />
          </div>
          <div className="w-full pl-10 sm:pl-10 md:pl-3 lg:pl-3 overflow-y-scroll vertical-scrollbar scrollbar-md">
            {children}
          </div>
        </div>
      </ContentWrapper>
    </>
  );
};

export default ProjectSettingLayout;

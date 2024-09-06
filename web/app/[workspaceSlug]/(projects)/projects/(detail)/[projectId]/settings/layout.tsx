"use client";

import { FC, ReactNode } from "react";
// components
import { ContentWrapper } from "@plane/ui";
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
      <ContentWrapper className="flex-row inset-y-0 gap-4">
        <div className="w-80 flex-shrink-0 overflow-y-hidden sm:hidden hidden md:block lg:block">
          <ProjectSettingsSidebar />
        </div>
        <div className="flex flex-col relative w-full overflow-hidden">
          <div className="w-full overflow-x-hidden overflow-y-scroll vertical-scrollbar scrollbar-md">{children}</div>
        </div>
      </ContentWrapper>
    </>
  );
};

export default ProjectSettingLayout;

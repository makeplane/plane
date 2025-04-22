"use client";

import { FC, ReactNode } from "react";
// components
import { AppHeader } from "@/components/core";
// local components
import { ProjectSettingHeader } from "../header";

export type TProjectEntityCreationLayout = {
  children: ReactNode;
};

const ProjectEntityCreationLayout: FC<TProjectEntityCreationLayout> = (props) => {
  const { children } = props;
  return (
    <>
      <AppHeader header={<ProjectSettingHeader />} />
      <div className="inset-y-0 flex flex-row vertical-scrollbar scrollbar-lg h-full w-full overflow-y-auto">
        <div className="flex flex-col relative w-full overflow-hidden">
          <div className="size-full overflow-x-hidden overflow-y-scroll vertical-scrollbar scrollbar-md">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectEntityCreationLayout;

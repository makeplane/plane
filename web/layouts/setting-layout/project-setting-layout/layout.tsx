import { FC, ReactNode } from "react";
// components
import { ProjectSettingsSidebar } from "./sidebar";

export interface IProjectSettingLayout {
  children: ReactNode;
}

export const ProjectSettingLayout: FC<IProjectSettingLayout> = (props) => {
  const { children } = props;

  return (
    <div className="flex gap-2 h-full w-full overflow-x-hidden overflow-y-scroll">
      <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
        <ProjectSettingsSidebar />
      </div>
      {children}
    </div>
  );
};

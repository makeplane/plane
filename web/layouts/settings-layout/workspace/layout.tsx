import { FC, ReactNode } from "react";
// components
import { WorkspaceSettingsSidebar } from "./sidebar";

export interface IWorkspaceSettingLayout {
  children: ReactNode;
}

export const WorkspaceSettingLayout: FC<IWorkspaceSettingLayout> = (props) => {
  const { children } = props;

  return (
    <div className="inset-y-0 z-20 flex h-full w-full gap-2 overflow-x-hidden overflow-y-scroll">
      <div className="w-80 flex-shrink-0 overflow-y-hidden pt-8 sm:hidden hidden md:block lg:block">
        <WorkspaceSettingsSidebar />
      </div>
      <div className="w-full pl-10 sm:pl-10 md:pl-0 lg:pl-0">
        {children}
      </div>
    </div>
  );
};

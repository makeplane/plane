import { FC, ReactNode } from "react";
// components
import { WorkspaceSettingsSidebar } from "./sidebar";

export interface IWorkspaceSettingLayout {
  children: ReactNode;
}

export const WorkspaceSettingLayout: FC<IWorkspaceSettingLayout> = (props) => {
  const { children } = props;

  return (
    <div className="flex h-full w-full gap-2 overflow-x-hidden overflow-y-scroll">
      <div className="w-80 flex-shrink-0 overflow-y-hidden pt-8">
        <WorkspaceSettingsSidebar />
      </div>
      {children}
    </div>
  );
};

import { FC, ReactNode } from "react";
// components
import { WorkspaceSettingsSidebar } from "./sidebar";

export interface IWorkspaceSettingLayout {
  children: ReactNode;
}

export const WorkspaceSettingLayout: FC<IWorkspaceSettingLayout> = (props) => {
  const { children } = props;

  return (
    <div className="flex gap-2 h-full w-full overflow-x-hidden overflow-y-scroll">
      <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
        <WorkspaceSettingsSidebar />
      </div>
      {children}
    </div>
  );
};

import { FC, ReactNode } from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { WorkspaceSettingsSidebar } from "./sidebar";

export interface IWorkspaceSettingLayout {
  children: ReactNode;
  header: ReactNode;
}

export const WorkspaceSettingLayout: FC<IWorkspaceSettingLayout> = (props) => {
  const { children, header } = props;

  return (
    <>
      <AppLayout header={header}>
        <div className="flex gap-2 h-full w-full overflow-x-hidden overflow-y-scroll">
          <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
            <WorkspaceSettingsSidebar />
          </div>
          {children}
        </div>
      </AppLayout>
    </>
  );
};

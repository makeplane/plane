import { FC, ReactNode } from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { ProjectSettingsSidebar } from "./sidebar";

export interface IProjectSettingLayout {
  children: ReactNode;
  header: ReactNode;
}

export const ProjectSettingLayout: FC<IProjectSettingLayout> = (props) => {
  const { children, header } = props;

  return (
    <>
      <AppLayout header={header} withProjectWrapper>
        <div className="flex gap-2 h-full w-full overflow-x-hidden overflow-y-scroll">
          <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
            <ProjectSettingsSidebar />
          </div>
          {children}
        </div>
      </AppLayout>
    </>
  );
};

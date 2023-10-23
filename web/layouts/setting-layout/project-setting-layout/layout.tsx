import { FC, ReactNode } from "react";
// layouts
import { UserAuthWrapper, ProjectAuthWrapper, WorkspaceAuthWrapper } from "layouts/auth-layout";
// components
import { AppSidebar } from "layouts/app-layout";
import { ProjectSettingsSidebar } from "./sidebar";

export interface IProjectSettingLayout {
  children: ReactNode;
  header: ReactNode;
}

export const ProjectSettingLayout: FC<IProjectSettingLayout> = (props) => {
  const { children, header } = props;

  return (
    <>
      <UserAuthWrapper>
        <WorkspaceAuthWrapper>
          <ProjectAuthWrapper>
            <div className="relative flex h-screen w-full overflow-hidden">
              <AppSidebar />
              <main className="relative flex flex-col h-full w-full overflow-hidden bg-custom-background-100">
                {header}
                <div className="h-full w-full overflow-hidden">
                  <div className="flex gap-2 relative h-full w-full overflow-x-hidden overflow-y-scroll">
                    <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
                      <ProjectSettingsSidebar />
                    </div>
                    {children}
                  </div>
                </div>
              </main>
            </div>
          </ProjectAuthWrapper>
        </WorkspaceAuthWrapper>
      </UserAuthWrapper>
    </>
  );
};

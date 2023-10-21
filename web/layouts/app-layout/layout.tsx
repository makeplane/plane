import { FC, ReactNode } from "react";
// layouts
import { UserAuthWrapper, WorkspaceAuthWrapper, ProjectAuthWrapper } from "layouts/auth-layout";
// components
import { CommandPalette } from "components/command-palette";
import { AppSidebar } from "./sidebar";

export interface IAppLayout {
  children: ReactNode;
  header: ReactNode;
  withProjectWrapper?: boolean;
}

export const AppLayout: FC<IAppLayout> = (props) => {
  const { children, header, withProjectWrapper = false } = props;

  return (
    <>
      {/* <CommandPalette /> */}
      <UserAuthWrapper>
        <WorkspaceAuthWrapper>
          <div className="relative flex h-screen w-full overflow-hidden">
            <AppSidebar />
            <main className="relative flex flex-col h-full w-full overflow-hidden bg-custom-background-100">
              {header}
              <div className="h-full w-full overflow-hidden">
                <div className="relative h-full w-full overflow-x-hidden overflow-y-scroll">
                  {withProjectWrapper ? <ProjectAuthWrapper>{children}</ProjectAuthWrapper> : <>{children}</>}
                </div>
              </div>
            </main>
          </div>
        </WorkspaceAuthWrapper>
      </UserAuthWrapper>
    </>
  );
};

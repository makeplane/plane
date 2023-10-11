import { FC, ReactNode } from "react";
// layouts
import { UserAuthWrapper, WorkspaceAuthWrapper } from "layouts/auth-layout";
// components
import { CommandPalette } from "components/command-palette";
import { AppSidebar } from "./sidebar";

export interface IAppLayout {
  children: ReactNode;
  header: ReactNode;
}

export const AppLayout: FC<IAppLayout> = (props) => {
  const { children, header } = props;

  return (
    <div className="h-screen w-full">
      {/* <CommandPalette /> */}
      <UserAuthWrapper>
        <WorkspaceAuthWrapper>
          <div className="flex w-full h-full">
            <AppSidebar />
            <div className="relative flex flex-col h-screen w-full overflow-hidden">
              <div className="w-full">{header}</div>
              <main className={`relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100`}>
                <div className="h-full w-full overflow-hidden">
                  <div className="relative h-full w-full overflow-x-hidden overflow-y-scroll">{children}</div>
                </div>
              </main>
            </div>
          </div>
        </WorkspaceAuthWrapper>
      </UserAuthWrapper>
    </div>
  );
};

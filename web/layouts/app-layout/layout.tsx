import { FC, ReactNode } from "react";
// layouts
import { UserAuthWrapper, WorkspaceAuthWrapper } from "layouts/auth-layout";
// components
import { CommandPalette } from "components/command-palette";
import { AppSidebar } from "./sidebar";

export interface IAppLayout {
  bg: string;
  children: ReactNode;
}

export const AppLayout: FC<IAppLayout> = (props) => {
  const { bg = "primary", children } = props;
  return (
    <div>
      <CommandPalette />
      <UserAuthWrapper>
        <WorkspaceAuthWrapper>
          <div>
            <AppSidebar />
            <div className="relative flex h-screen w-full overflow-hidden">
              <main
                className={`relative flex h-full w-full flex-col overflow-hidden ${
                  bg === "primary"
                    ? "bg-custom-background-100"
                    : bg === "secondary"
                    ? "bg-custom-background-90"
                    : "bg-custom-background-80"
                }`}
              >
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

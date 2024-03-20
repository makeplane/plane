import { FC, ReactNode } from "react";
// layouts
import { observer } from "mobx-react-lite";
import { CommandPalette } from "@/components/command-palette";
import { UserAuthWrapper, WorkspaceAuthWrapper, ProjectAuthWrapper } from "@/layouts/auth-layout";
// components
import { AppSidebar } from "./sidebar";
import { SidebarHamburgerToggle } from "@/components/core/sidebar/sidebar-menu-hamburger-toggle";

export interface IAppLayout {
  children: ReactNode;
  header: ReactNode;
  withProjectWrapper?: boolean;
  mobileHeader?: ReactNode;
}

export const AppLayout: FC<IAppLayout> = observer((props) => {
  const { children, header, withProjectWrapper = false, mobileHeader } = props;

  return (
    <>
      <CommandPalette />
      <UserAuthWrapper>
        <WorkspaceAuthWrapper>
          <div className="relative flex h-screen w-full overflow-hidden">
            <AppSidebar />
            <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
              <div className="z-[15]">
                <div className="flex items-center w-full border-b border-custom-border-200 z-10">
                  <div className="pl-5 py-4  bg-custom-sidebar-background-100 block md:hidden">
                    <SidebarHamburgerToggle />
                  </div>
                  <div className="w-full">{header}</div>
                </div>
                {mobileHeader && mobileHeader}
              </div>
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
});

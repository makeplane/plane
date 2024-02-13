import { FC, ReactNode } from "react";
// layouts
import { UserAuthWrapper, WorkspaceAuthWrapper, ProjectAuthWrapper } from "layouts/auth-layout";
// components
import { CommandPalette } from "components/command-palette";
import { AppSidebar } from "./sidebar";
import { observer } from "mobx-react-lite";

//  FIXME: remove this later
import { useIssues } from "hooks/store/use-issues";
import { EIssuesStoreType } from "constants/issue";
import useSWR from "swr";
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";

export interface IAppLayout {
  children: ReactNode;
  header: ReactNode;
  mobileHeader?: ReactNode;
  withProjectWrapper?: boolean;
}

export const AppLayout: FC<IAppLayout> = observer((props) => {
  const { children, header, mobileHeader, withProjectWrapper = false } = props;

  const workspaceSlug = "plane-demo";
  const projectId = "b16907a9-a55f-4f5b-b05e-7065a0869ba6";

  const { issues, issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED);

  useSWR(
    workspaceSlug && projectId ? `PROJECT_ARCHIVED_ISSUES_V3_${workspaceSlug}_${projectId}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await issuesFilter?.fetchFilters(workspaceSlug, projectId);
        // await issues?.fetchIssues(workspaceSlug, projectId, issues?.groupedIssueIds ? "mutation" : "init-loader");
      }
    },
    { revalidateOnFocus: false, refreshInterval: 600000, revalidateOnMount: true }
  );

  return (
    <>
      <CommandPalette />
      <UserAuthWrapper>
        <WorkspaceAuthWrapper>
          <div className="relative flex h-screen w-full overflow-hidden">
            <AppSidebar />
            <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
              <div className="z-10">
                <div className="flex items-center w-full border-b border-custom-border-200 z-10">
                  <div className="pl-5 py-4  bg-custom-sidebar-background-100 block md:hidden">
                    <SidebarHamburgerToggle />
                  </div>
                  <div className="w-full">
                    {header}
                  </div>
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

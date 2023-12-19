import { FC, ReactNode } from "react";
// layouts
import { UserAuthWrapper, WorkspaceAuthWrapper, ProjectAuthWrapper } from "layouts/auth-layout";
// components
import { CommandPalette } from "components/command-palette";
import { AppSidebar } from "./sidebar";

// TODO: remove this before push
import { useIssues } from "hooks/store/use-issues";
import { EIssuesStoreType } from "constants/issue";
import useSWR from "swr";
import { observer } from "mobx-react-lite";

export interface IAppLayout {
  children: ReactNode;
  header: ReactNode;
  withProjectWrapper?: boolean;
}

export const AppLayout: FC<IAppLayout> = observer((props) => {
  const { children, header, withProjectWrapper = false } = props;

  const workspaceSlug = "plane";
  const projectId = "02c3e1d5-d7e2-401d-a773-45ecba45d745";
  const cycleId = "937e7405-aa19-4930-b12b-3d1203c03487";
  const moduleId = "";

  // const { issueMap, issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT);
  // useSWR(
  //   workspaceSlug && projectId ? `PROJECT_ISSUES_${workspaceSlug}_${projectId}` : null,
  //   async () => {
  //     if (workspaceSlug && projectId) {
  //       await issuesFilter?.fetchFilters(workspaceSlug, projectId);
  //       await issues?.fetchIssues(workspaceSlug, projectId, "init-loader");
  //     }
  //   },
  //   { revalidateOnFocus: false, refreshInterval: 600000, revalidateOnMount: true }
  // );

  const { issueMap, issues, issuesFilter } = useIssues(EIssuesStoreType.CYCLE);
  useSWR(
    workspaceSlug && projectId && cycleId ? `PROJECT_CYCLE_ISSUES_${workspaceSlug}_${projectId}_${cycleId}` : null,
    async () => {
      if (workspaceSlug && projectId && cycleId) {
        await issuesFilter?.fetchFilters(workspaceSlug, projectId, cycleId);
        await issues?.fetchIssues(workspaceSlug, projectId, "init-loader");
      }
    },
    { revalidateOnFocus: false, refreshInterval: 600000, revalidateOnMount: true }
  );

  // const { issueMap, issues, issuesFilter } = useIssues(EIssuesStoreType.MODULE);
  // useSWR(
  //   workspaceSlug && projectId && moduleId ? `PROJECT_MODULE_ISSUES_${workspaceSlug}_${projectId}_${moduleId}` : null,
  //   async () => {
  //     if (workspaceSlug && projectId && moduleId) {
  //       await issuesFilter?.fetchFilters(workspaceSlug, projectId);
  //       await issues?.fetchIssues(workspaceSlug, projectId, "init-loader");
  //     }
  //   },
  //   { revalidateOnFocus: false, refreshInterval: 600000, revalidateOnMount: true }
  // );

  console.log("---");
  console.log("issuesFilter", issuesFilter?.issueFilters);
  console.log("issueMap", issueMap);
  console.log("issues Ids", issues?.getIssuesIds);
  console.log("---");

  return (
    <>
      <CommandPalette />
      <UserAuthWrapper>
        <WorkspaceAuthWrapper>
          <div className="relative flex h-screen w-full overflow-hidden">
            {/* <AppSidebar />
            <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
              {header}
              <div className="h-full w-full overflow-hidden">
                <div className="relative h-full w-full overflow-x-hidden overflow-y-scroll">
                  {withProjectWrapper ? <ProjectAuthWrapper>{children}</ProjectAuthWrapper> : <>{children}</>}
                </div>
              </div>
            </main> */}
          </div>
        </WorkspaceAuthWrapper>
      </UserAuthWrapper>
    </>
  );
});

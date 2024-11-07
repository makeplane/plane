"use client";

import { FC, Fragment } from "react";
import { observer } from "mobx-react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import useSWR from "swr";
// components
import { Spinner } from "@plane/ui";
import { LogoSpinner } from "@/components/common";

// constants
import { EIssueLayoutTypes, EIssuesStoreType } from "@/constants/issue";
// hooks
import { useIssues } from "@/hooks/store";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";

const ProjectAppliedFiltersRoot = dynamic(
  () =>
    import("@/components/issues/issue-layouts/filters/applied-filters/roots/project-root").then(
      (m) => m.ProjectAppliedFiltersRoot
    ),
  {
    ssr: false,
    loading: () => <LogoSpinner />,
  }
);
const ListLayout = dynamic(
  () => import("@/components/issues/issue-layouts/list/roots/project-root").then((m) => m.ListLayout),
  {
    ssr: false,
    loading: () => <LogoSpinner />,
  }
);
const KanBanLayout = dynamic(
  () => import("@/components/issues/issue-layouts/kanban/roots/project-root").then((m) => m.KanBanLayout),
  {
    ssr: false,
    loading: () => <LogoSpinner />,
  }
);
const CalendarLayout = dynamic(
  () => import("@/components/issues/issue-layouts/calendar/roots/project-root").then((m) => m.CalendarLayout),
  {
    ssr: false,
    loading: () => <LogoSpinner />,
  }
);
const BaseGanttRoot = dynamic(
  () => import("@/components/issues/issue-layouts/gantt/base-gantt-root").then((m) => m.BaseGanttRoot),
  {
    ssr: false,
    loading: () => <LogoSpinner />,
  }
);
const ProjectSpreadsheetLayout = dynamic(
  () =>
    import("@/components/issues/issue-layouts/spreadsheet/roots/project-root").then((m) => m.ProjectSpreadsheetLayout),
  {
    ssr: false,
    loading: () => <LogoSpinner />,
  }
);
const ProjectIssueLayout = (props: { activeLayout: EIssueLayoutTypes | undefined }) => {
  switch (props.activeLayout) {
    case EIssueLayoutTypes.LIST:
      return <ListLayout />;
    case EIssueLayoutTypes.KANBAN:
      return <KanBanLayout />;
    case EIssueLayoutTypes.CALENDAR:
      return <CalendarLayout />;
    case EIssueLayoutTypes.GANTT:
      return <BaseGanttRoot />;
    case EIssueLayoutTypes.SPREADSHEET:
      return <ProjectSpreadsheetLayout />;
    default:
      return null;
  }
};
const IssuePeekOverview = dynamic(
  () => import("@/components/issues/peek-overview/root").then((m) => m.IssuePeekOverview),
  {
    ssr: false,
    loading: () => <LogoSpinner />,
  }
);

export const ProjectLayoutRoot: FC = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT);

  const { isLoading } = useSWR(
    workspaceSlug && projectId ? `PROJECT_ISSUES_${workspaceSlug}_${projectId}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await issuesFilter?.fetchFilters(workspaceSlug.toString(), projectId.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const issueFilters = issuesFilter?.getIssueFilters(projectId?.toString());
  const activeLayout = issueFilters?.displayFilters?.layout;

  if (!workspaceSlug || !projectId) return <></>;

  if (isLoading && !issueFilters)
    return (
      <div className="h-full w-full flex items-center justify-center">
        <LogoSpinner />
      </div>
    );

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.PROJECT}>
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <ProjectAppliedFiltersRoot />
        <div className="relative h-full w-full overflow-auto bg-custom-background-90">
          {/* mutation loader */}
          {issues?.getIssueLoader() === "mutation" && (
            <div className="fixed w-[40px] h-[40px] z-50 right-[20px] top-[70px] flex justify-center items-center bg-custom-background-80 shadow-sm rounded">
              <Spinner className="w-4 h-4" />
            </div>
          )}
          <ProjectIssueLayout activeLayout={activeLayout} />
        </div>

        {/* peek overview */}
        <IssuePeekOverview />
      </div>
    </IssuesStoreContext.Provider>
  );
});

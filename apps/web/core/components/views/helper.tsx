import { EIssueLayoutTypes } from "@plane/types";
import { WorkspaceSpreadsheetRoot } from "@/components/issues/issue-layouts/spreadsheet/roots/workspace-root";
import { WorkspaceAdditionalLayouts } from "@/plane-web/components/views/helper";

export type TWorkspaceLayoutProps = {
  activeLayout: EIssueLayoutTypes | undefined;
  isDefaultView: boolean;
  isLoading?: boolean;
  toggleLoading: (value: boolean) => void;
  workspaceSlug: string;
  globalViewId: string;
  routeFilters: {
    [key: string]: string;
  };
  fetchNextPages: () => void;
  globalViewsLoading: boolean;
  issuesLoading: boolean;
};

export function WorkspaceActiveLayout(props: TWorkspaceLayoutProps) {
  const {
    activeLayout = EIssueLayoutTypes.SPREADSHEET,
    isDefaultView,
    isLoading,
    toggleLoading,
    workspaceSlug,
    globalViewId,
    routeFilters,
    fetchNextPages,
    globalViewsLoading,
    issuesLoading,
  } = props;
  switch (activeLayout) {
    case EIssueLayoutTypes.SPREADSHEET:
      return (
        <WorkspaceSpreadsheetRoot
          isDefaultView={isDefaultView}
          isLoading={isLoading}
          toggleLoading={toggleLoading}
          workspaceSlug={workspaceSlug}
          globalViewId={globalViewId}
          routeFilters={routeFilters}
          fetchNextPages={fetchNextPages}
          globalViewsLoading={globalViewsLoading}
          issuesLoading={issuesLoading}
        />
      );
    default:
      return <WorkspaceAdditionalLayouts {...props} />;
  }
}

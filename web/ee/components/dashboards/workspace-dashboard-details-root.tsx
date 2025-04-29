import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";
// local components
import { DashboardsWidgetsListRoot } from "./details/root";
import { DashboardsWidgetConfigSidebarRoot } from "./sidebar";

export const WorkspaceDashboardDetailsRoot = observer(() => {
  // navigation
  const { dashboardId } = useParams();
  // store hooks
  const {
    workspaceDashboards: { fetchDashboardDetails },
  } = useDashboards();

  useSWR(
    dashboardId ? `WORKSPACE_DASHBOARD_DETAILS_${dashboardId.toString()}` : null,
    dashboardId ? () => fetchDashboardDetails(dashboardId.toString()) : null
  );

  return (
    <div className="size-full flex overflow-hidden">
      <DashboardsWidgetsListRoot
        className="flex-shrink-0 flex-grow px-page-x py-6 overflow-y-scroll vertical-scrollbar scrollbar-sm"
        dashboardId={dashboardId.toString()}
      />
      <DashboardsWidgetConfigSidebarRoot
        className="flex-shrink-0 h-full border-l border-custom-border-200 overflow-y-scroll vertical-scrollbar scrollbar-sm"
        dashboardId={dashboardId.toString()}
      />
    </div>
  );
});

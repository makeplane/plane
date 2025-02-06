import { observer } from "mobx-react";
// components
import { ListLayout } from "@/components/core/list";
import { SimpleEmptyState } from "@/components/empty-state";
// plane web hooks
import { useWorkspaceDashboards } from "@/plane-web/hooks/store";
// local components
import { WorkspaceDashboardListItem } from "./list-item";

export const WorkspaceDashboardsListRoot = observer(() => {
  // store hooks
  const { loader, isAnyDashboardAvailable, currentWorkspaceDashboardIds, getDashboardById } = useWorkspaceDashboards();

  // no dashboards empty state
  if (loader !== "init-loader" && !isAnyDashboardAvailable) {
    return (
      <div className="size-full grid place-items-center">
        <SimpleEmptyState title="That doesn't" />
      </div>
    );
  }

  return (
    <ListLayout>
      {currentWorkspaceDashboardIds.map((dashboardId) => (
        <WorkspaceDashboardListItem key={dashboardId} getDashboardDetails={getDashboardById} id={dashboardId} />
      ))}
    </ListLayout>
  );
});

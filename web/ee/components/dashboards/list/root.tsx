import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { ListLayout } from "@/components/core/list";
import { DetailedEmptyState } from "@/components/empty-state";
// hooks
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";
// local components
import { DashboardListItem } from "./list-item";
import { DashboardsListLayoutLoader } from "./loader";

export const DashboardsListLayoutRoot = observer(() => {
  // navigation
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    getDashboardById,
    workspaceDashboards: {
      currentWorkspaceFetchStatus,
      isAnyDashboardAvailable,
      currentWorkspaceDashboardIds,
      fetchDashboards,
    },
  } = useDashboards();
  // translation
  const { t } = useTranslation();
  // derived values
  const dashboardsAssetResolvedPath = useResolvedAssetPath({ basePath: "/empty-state/dashboards/list" });

  useSWR(
    workspaceSlug ? `WORKSPACE_DASHBOARDS_LIST_${workspaceSlug.toString()}` : null,
    workspaceSlug ? () => fetchDashboards() : null
  );

  if (!currentWorkspaceFetchStatus) {
    return <DashboardsListLayoutLoader />;
  }

  // no dashboards empty state
  if (!isAnyDashboardAvailable) {
    return (
      <div className="size-full grid place-items-center">
        <DetailedEmptyState
          title={t("dashboards.empty_state.dashboards_list.title")}
          description={t("dashboards.empty_state.dashboards_list.description")}
          assetPath={dashboardsAssetResolvedPath}
        />
      </div>
    );
  }

  return (
    <ListLayout>
      {currentWorkspaceDashboardIds.map((dashboardId) => (
        <DashboardListItem key={dashboardId} getDashboardDetails={getDashboardById} id={dashboardId} />
      ))}
    </ListLayout>
  );
});

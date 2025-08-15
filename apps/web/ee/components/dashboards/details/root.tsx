import { observer } from "mobx-react";
import useSWR from "swr";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";
// local components
import { DashboardWidgetDeleteModal } from "../widgets/delete-modal";
import { DashboardsWidgetsListEmptyState } from "./empty-state";
import { DashboardsWidgetsGridRoot } from "./widgets-grid-root";

type Props = {
  className?: string;
  dashboardId: string;
};

export const DashboardsWidgetsListRoot: React.FC<Props> = observer((props) => {
  const { className, dashboardId } = props;
  // store hooks
  const { getDashboardById } = useDashboards();
  // derived values
  const dashboardDetails = getDashboardById(dashboardId);
  const { widgetsStore } = dashboardDetails ?? {};
  const { isDeletingWidget, fetchWidgets, isAnyWidgetAvailable, toggleDeleteWidget } = widgetsStore ?? {};

  const { data, isLoading } = useSWR(
    dashboardDetails && dashboardId ? `DASHBOARD_WIDGETS_LIST_${dashboardId.toString()}` : null,
    dashboardDetails && dashboardId ? () => fetchWidgets?.() : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
    }
  );

  if (isLoading || !data) {
    return (
      <div className="size-full grid place-items-center">
        <LogoSpinner />
      </div>
    );
  }

  if (!isAnyWidgetAvailable) {
    return <DashboardsWidgetsListEmptyState dashboardId={dashboardId?.toString() ?? ""} />;
  }

  return (
    <>
      <DashboardWidgetDeleteModal
        dashboardId={dashboardId?.toString() ?? ""}
        handleClose={() => toggleDeleteWidget?.(null)}
        isOpen={!!isDeletingWidget}
        widgetId={isDeletingWidget ?? null}
      />
      <main className={className}>
        <DashboardsWidgetsGridRoot dashboardId={dashboardId} />
      </main>
    </>
  );
});

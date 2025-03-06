import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Eye, LayoutGrid, Pencil } from "lucide-react";
// plane imports
import { EWidgetChartTypes } from "@plane/constants";
import { Breadcrumbs, Button, Header, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// plane web components
import { DashboardWidgetChartTypesDropdown } from "@/plane-web/components/dashboards/widgets/chart-types/dropdown";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";

export const WorkspaceDashboardDetailsHeader = observer(() => {
  // states
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  // navigation
  const { workspaceSlug, dashboardId } = useParams();
  // store hooks
  const { getDashboardById } = useDashboards();
  // derived values
  const dashboardDetails = getDashboardById(dashboardId?.toString() ?? "");
  const { canCurrentUserEditDashboard, isViewModeEnabled, toggleViewingMode, widgetsStore } = dashboardDetails ?? {};
  const { canCurrentUserCreateWidget, getNewWidgetPayload, createWidget, toggleEditWidget } = widgetsStore ?? {};

  const handleAddNewWidget = async (chartType: EWidgetChartTypes) => {
    const payload = getNewWidgetPayload?.(chartType);
    if (!payload) return;
    try {
      setIsAddingWidget(true);
      const res = await createWidget?.(payload);
      if (res?.id) {
        toggleEditWidget?.(res.id);
      }
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to add widget. Please try again.",
      });
    } finally {
      setIsAddingWidget(false);
    }
  };

  return (
    <Header>
      <Header.LeftItem>
        <div>
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/dashboards`}
                  label="Dashboards"
                  icon={<LayoutGrid className="size-4 text-custom-text-300" />}
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  label={
                    <div className="flex items-center gap-2 truncate">
                      {dashboardDetails && !isViewModeEnabled && (
                        <span className="flex-shrink-0 bg-custom-primary-100/20 text-custom-primary-100 rounded p-1">
                          Editing
                        </span>
                      )}
                      <span className="truncate">{dashboardDetails?.name ?? ""}</span>
                    </div>
                  }
                  disableTooltip
                />
              }
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      {dashboardDetails && (
        <Header.RightItem>
          {!isViewModeEnabled && canCurrentUserCreateWidget && (
            <DashboardWidgetChartTypesDropdown
              loading={isAddingWidget}
              disabled={!canCurrentUserCreateWidget}
              onClick={handleAddNewWidget}
            />
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => toggleViewingMode?.()}
            prependIcon={isViewModeEnabled ? <Pencil className="size-3.5" /> : <Eye className="size-3.5" />}
            disabled={!canCurrentUserEditDashboard}
          >
            {isViewModeEnabled ? "Edit" : "View"}
          </Button>
        </Header.RightItem>
      )}
    </Header>
  );
});

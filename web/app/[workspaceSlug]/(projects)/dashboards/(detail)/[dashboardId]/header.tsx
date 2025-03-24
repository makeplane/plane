import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Eye, LayoutGrid, Pencil, Plus } from "lucide-react";
// plane imports
import { EWidgetChartModels, EWidgetChartTypes } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs, Button, getButtonStyling, Header, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// plane web components
import { DashboardWidgetChartTypesDropdown } from "@/plane-web/components/dashboards/widgets/dropdown";
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
  // translation
  const { t } = useTranslation();

  const handleAddNewWidget = async (chartType: EWidgetChartTypes, chartModel: EWidgetChartModels) => {
    const payload = getNewWidgetPayload?.(chartType, chartModel);
    if (!payload) return;
    try {
      setIsAddingWidget(true);
      const res = await createWidget?.(payload);
      if (res?.id) {
        toggleEditWidget?.(res.id);
        const widgetElement = document.getElementById(`widget-${res.id}`);
        widgetElement?.scrollIntoView({ behavior: "smooth" });
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
                  label={t("workspace_dashboards")}
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
                        <span className="flex-shrink-0 bg-custom-primary-100/20 text-custom-primary-100 rounded px-1 py-0.5">
                          {t("dashboards.common.editing")}
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
              buttonClassName={getButtonStyling("neutral-primary", "sm")}
              buttonContent={
                <>
                  {!isAddingWidget && <Plus className="flex-shrink-0 size-3.5" />}
                  {t(isAddingWidget ? "common.adding" : "dashboards.widget.common.add_widget")}
                </>
              }
              disabled={isAddingWidget}
              onSelect={(val) => handleAddNewWidget(val.chartType, val.chartModel)}
            />
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => toggleViewingMode?.()}
            prependIcon={isViewModeEnabled ? <Pencil className="size-3.5" /> : <Eye className="size-3.5" />}
            disabled={!canCurrentUserEditDashboard}
          >
            {t(isViewModeEnabled ? "common.edit" : "common.view")}
          </Button>
        </Header.RightItem>
      )}
    </Header>
  );
});

import { useState } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EWidgetChartModels, EWidgetChartTypes } from "@plane/types";
import { getButtonStyling, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { SimpleEmptyState } from "@/components/empty-state";
// hooks
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { useDashboards } from "@/plane-web/hooks/store";
import { DashboardWidgetChartTypesDropdown } from "../widgets/dropdown";

type Props = {
  dashboardId: string;
};

export const DashboardsWidgetsListEmptyState: React.FC<Props> = observer((props) => {
  const { dashboardId } = props;
  // states
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  // store hooks
  const { getDashboardById } = useDashboards();
  // derived values
  const { isViewModeEnabled, widgetsStore } = getDashboardById(dashboardId) ?? {};
  const { canCurrentUserCreateWidget, createWidget, getNewWidgetPayload, toggleEditWidget } = widgetsStore ?? {};
  // translation
  const { t } = useTranslation();
  // empty state asset path
  const widgetsAssetResolvedPath = useResolvedAssetPath({ basePath: "/empty-state/dashboards/widgets/list" });

  const handleAddNewWidget = async (chartType: EWidgetChartTypes, chartModel: EWidgetChartModels) => {
    const payload = getNewWidgetPayload?.(chartType, chartModel);
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
    <div className="size-full grid place-items-center px-page-x">
      <div className="flex flex-col items-center gap-5">
        <SimpleEmptyState
          title={t("dashboards.empty_state.widgets_list.title")}
          description={t("dashboards.empty_state.widgets_list.description")}
          assetPath={widgetsAssetResolvedPath}
          size="lg"
        />
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
            placement="auto"
          />
        )}
      </div>
    </div>
  );
});

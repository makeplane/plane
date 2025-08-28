import { observer } from "mobx-react";
// plane imports
import { EWidgetGridBreakpoints } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// hooks
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";
// chart types
import { commonWidgetClassName } from "..";

type Props = {
  activeBreakpoint: EWidgetGridBreakpoints;
  dashboardId: string;
  widgetId: string;
};

export const DashboardWidgetNotConfiguredState: React.FC<Props> = observer((props) => {
  const { activeBreakpoint, dashboardId, widgetId } = props;
  // store hooks
  const { getDashboardById } = useDashboards();
  // derived values
  const dashboardDetails = getDashboardById(dashboardId);
  const { isViewModeEnabled, toggleViewingMode } = dashboardDetails ?? {};
  const { getWidgetById, isEditingWidget, toggleEditWidget } = dashboardDetails?.widgetsStore ?? {};
  const widget = getWidgetById?.(widgetId);
  const { canCurrentUserEditWidget, chart_model, chart_type, isConfigurationMissing, height } = widget ?? {};
  const isWidgetSelected = isEditingWidget === widgetId;
  const shouldShowIcon = activeBreakpoint === EWidgetGridBreakpoints.XXS || height !== 1;
  const isEditingEnabled = !isViewModeEnabled && !!canCurrentUserEditWidget;
  // translation
  const { t } = useTranslation();
  // resolved asset
  const resolvedPath = useResolvedAssetPath({
    basePath: `/empty-state/dashboards/widgets/charts/${chart_type?.toLowerCase()}`,
  });

  const handleConfigureWidget = () => {
    toggleEditWidget?.(widgetId);
    toggleViewingMode?.(false);
  };

  return (
    <div
      className={commonWidgetClassName({
        className: "grid place-items-center px-4 overflow-hidden",
        isEditingEnabled,
        isSelected: isWidgetSelected,
        isResizingDisabled: !isEditingEnabled || activeBreakpoint === EWidgetGridBreakpoints.XXS,
      })}
    >
      <div className="flex flex-col items-center gap-3">
        <SimpleEmptyState
          title={t(
            `dashboards.widget.not_configured_state.${chart_type?.toLowerCase()}.${chart_model?.toLowerCase()}.${isConfigurationMissing}`
          )}
          assetPath={shouldShowIcon ? resolvedPath : undefined}
        />
        {canCurrentUserEditWidget ? (
          isViewModeEnabled ? (
            <p className="text-sm text-custom-text-400 text-center whitespace-pre-line">
              Switch to{" "}
              <Button
                onClick={handleConfigureWidget}
                variant="link-primary"
                size="sm"
                className="w-fit inline-flex p-0"
              >
                Edit mode
              </Button>{" "}
              to configure your widget.
            </p>
          ) : (
            <Button onClick={handleConfigureWidget} variant="link-primary" size="sm" className="w-fit">
              {t("dashboards.widget.common.configure_widget")}
            </Button>
          )
        ) : (
          <p className="text-sm text-custom-text-400 text-center whitespace-pre-line">
            {t("dashboards.widget.not_configured_state.ask_admin")}
          </p>
        )}
      </div>
    </div>
  );
});

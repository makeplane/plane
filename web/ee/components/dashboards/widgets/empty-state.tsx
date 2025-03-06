import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
// components
import { SimpleEmptyState } from "@/components/empty-state";
// hooks
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";
// plane web stores
import { DashboardWidgetInstance } from "@/plane-web/store/dashboards/widget";

type Props = {
  dashboardId: string;
  widget: DashboardWidgetInstance;
};

export const DashboardWidgetEmptyState: React.FC<Props> = observer((props) => {
  const { dashboardId, widget } = props;
  // store hooks
  const { getDashboardById } = useDashboards();
  // derived values
  const dashboardDetails = getDashboardById(dashboardId);
  const { isViewModeEnabled } = dashboardDetails ?? {};
  const { toggleEditWidget } = dashboardDetails?.widgetsStore ?? {};
  const { canCurrentUserEditWidget, chart_type, height } = widget;
  const shouldShowIcon = height !== 1;
  // translation
  const { t } = useTranslation();
  // resolved asset
  const resolvedPath = useResolvedAssetPath({
    basePath: `/empty-state/dashboards/widgets/charts/${chart_type?.toLowerCase()}`,
  });

  const handleConfigureWidget = () => {
    toggleEditWidget?.(widget.id ?? "");
  };

  return (
    <div className="size-full grid place-items-center">
      <div className="flex flex-col items-center gap-3">
        <SimpleEmptyState
          title={t("dashboards.empty_state.widget_data.title")}
          assetPath={shouldShowIcon ? resolvedPath : undefined}
        />
        {canCurrentUserEditWidget &&
          (isViewModeEnabled ? (
            <p className="text-sm text-custom-text-400">{t("dashboards.empty_state.widget_data.description")}</p>
          ) : (
            <p className="text-sm text-custom-text-400">
              Refresh to load the latest data or{" "}
              <Button
                onClick={handleConfigureWidget}
                variant="link-primary"
                size="sm"
                className="w-fit inline-flex p-0"
              >
                reconfigure
              </Button>{" "}
              this widget.
            </p>
          ))}
      </div>
    </div>
  );
});

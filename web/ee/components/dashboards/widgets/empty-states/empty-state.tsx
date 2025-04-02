import { useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import { EWidgetGridBreakpoints } from "@plane/constants";
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
  activeBreakpoint: EWidgetGridBreakpoints;
  dashboardId: string;
  widget: DashboardWidgetInstance;
};

export const DashboardWidgetEmptyState: React.FC<Props> = observer((props) => {
  const { activeBreakpoint, dashboardId, widget } = props;
  // store hooks
  const { getDashboardById } = useDashboards();
  // derived values
  const dashboardDetails = getDashboardById(dashboardId);
  const { isViewModeEnabled } = dashboardDetails ?? {};
  const { canCurrentUserEditWidget, chart_type, height, fetchWidgetData } = widget;
  const shouldShowIcon = activeBreakpoint === EWidgetGridBreakpoints.XXS || height !== 1;
  // translation
  const { t } = useTranslation();
  // resolved asset
  const resolvedPath = useResolvedAssetPath({
    basePath: `/empty-state/dashboards/widgets/charts/${chart_type?.toLowerCase()}`,
  });

  const handleRefresh = useCallback(async () => {
    await fetchWidgetData?.();
  }, [fetchWidgetData]);

  return (
    <div className="size-full grid place-items-center px-4 overflow-hidden">
      <div className="flex flex-col items-center gap-3">
        <SimpleEmptyState
          title={t("dashboards.empty_state.widget_data.title")}
          assetPath={shouldShowIcon ? resolvedPath : undefined}
        />
        {canCurrentUserEditWidget &&
          (isViewModeEnabled ? (
            <p className="text-sm text-custom-text-400 text-center whitespace-pre-line">
              {t("dashboards.empty_state.widget_data.description")}
            </p>
          ) : (
            <p className="text-sm text-custom-text-400 text-center whitespace-pre-line">
              <Button onClick={handleRefresh} variant="link-primary" size="sm" className="w-fit inline-flex p-0">
                Refresh
              </Button>{" "}
              or add data to see it here.
            </p>
          ))}
      </div>
    </div>
  );
});

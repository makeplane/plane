import { useMemo, useRef } from "react";
import { toJS } from "mobx";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EWidgetGridBreakpoints } from "@plane/constants";
import { EWidgetChartTypes } from "@plane/types";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";
// chart types
import { DashboardWidgetNotConfiguredState } from "../empty-states/not-configured-state";
import { DashboardAreaChartWidget } from "./area-chart";
import { DashboardBarChartWidget } from "./bar-chart";
import { DashboardWidgetContent } from "./content";
import { DashboardDonutChartWidget } from "./donut-chart";
import { DashboardWidgetHeader } from "./header";
import { DashboardLineChartWidget } from "./line-chart";
import { DashboardNumberWidget } from "./number";
import { DashboardPieChartWidget } from "./pie-chart";
import { commonWidgetClassName, parseWidgetData, TWidgetComponentProps } from "./";

type Props = {
  activeBreakpoint: EWidgetGridBreakpoints;
  dashboardId: string;
  widgetId: string;
};

export const DashboardWidgetRoot: React.FC<Props> = observer((props) => {
  const { activeBreakpoint, dashboardId, widgetId } = props;
  // refs
  const widgetRef = useRef<HTMLDivElement>(null);
  // store hooks
  const { getDashboardById } = useDashboards();
  // derived values
  const dashboardDetails = getDashboardById(dashboardId);
  const { isViewModeEnabled, widgetsStore } = dashboardDetails ?? {};
  const { getWidgetById, isEditingWidget, toggleEditWidget } = widgetsStore ?? {};
  const widget = getWidgetById?.(widgetId);
  const {
    canCurrentUserEditWidget,
    chart_type,
    data,
    fetchWidgetData,
    isConfigurationMissing,
    isWidgetAvailableInCurrentPlan,
    x_axis_property,
    group_by,
    x_axis_date_grouping,
  } = widget ?? {};
  const isWidgetSelected = isEditingWidget === widgetId;
  const isWidgetConfigured = !isConfigurationMissing;
  const isEditingEnabled = !isViewModeEnabled && !!canCurrentUserEditWidget;
  const parsedData = useMemo(
    () => parseWidgetData(toJS(data), x_axis_property, group_by, x_axis_date_grouping),
    [data, group_by, x_axis_date_grouping, x_axis_property]
  );

  useSWR(
    isWidgetConfigured && isWidgetAvailableInCurrentPlan && widgetId ? `WIDGET_DATA_${widgetId}` : null,
    isWidgetConfigured && isWidgetAvailableInCurrentPlan && widgetId ? () => fetchWidgetData?.() : null
  );

  let WidgetComponent: React.FC<TWidgetComponentProps> | null = null;
  switch (chart_type) {
    case EWidgetChartTypes.NUMBER:
      WidgetComponent = DashboardNumberWidget;
      break;
    case EWidgetChartTypes.BAR_CHART:
      WidgetComponent = DashboardBarChartWidget;
      break;
    case EWidgetChartTypes.LINE_CHART:
      WidgetComponent = DashboardLineChartWidget;
      break;
    case EWidgetChartTypes.AREA_CHART:
      WidgetComponent = DashboardAreaChartWidget;
      break;
    case EWidgetChartTypes.DONUT_CHART:
      WidgetComponent = DashboardDonutChartWidget;
      break;
    case EWidgetChartTypes.PIE_CHART:
      WidgetComponent = DashboardPieChartWidget;
      break;
    default:
      WidgetComponent = null;
  }

  if (isWidgetAvailableInCurrentPlan && !isWidgetConfigured) {
    return (
      <DashboardWidgetNotConfiguredState
        activeBreakpoint={activeBreakpoint}
        dashboardId={dashboardId}
        widgetId={widgetId}
      />
    );
  }

  if (!widget || !WidgetComponent) return null;

  return (
    <div
      ref={widgetRef}
      className={commonWidgetClassName({
        isEditingEnabled,
        isSelected: isWidgetSelected,
        isResizingDisabled: !isEditingEnabled || activeBreakpoint === EWidgetGridBreakpoints.XXS,
      })}
      onClick={() => {
        if (!isEditingEnabled || isEditingWidget === widgetId) return;
        toggleEditWidget?.(widgetId);
      }}
      role={isEditingEnabled ? "button" : "none"}
    >
      <DashboardWidgetHeader dashboardId={dashboardId} widget={widget} widgetRef={widgetRef} />
      <DashboardWidgetContent
        activeBreakpoint={activeBreakpoint}
        dashboardId={dashboardId}
        isDataAvailable={!!data}
        isDataEmpty={data?.data.length === 0}
        widget={widget}
      >
        <WidgetComponent parsedData={parsedData} widget={widget} />
      </DashboardWidgetContent>
    </div>
  );
});

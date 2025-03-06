import { useRef } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EWidgetChartTypes, EWidgetGridBreakpoints } from "@plane/constants";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";
// chart types
import { DashboardWidgetNotConfiguredState } from "../not-configured-state";
import { DashboardAreaChartWidget } from "./area-chart";
import { DashboardBarChartWidget } from "./bar-chart";
import { DashboardWidgetContent } from "./content";
import { DashboardDonutChartWidget } from "./donut-chart";
import { DashboardWidgetHeader } from "./header";
import { DashboardLineChartWidget } from "./line-chart";
import { DashboardPieChartWidget } from "./pie-chart";
import { DashboardTextWidget } from "./text";
import { commonWidgetClassName, TWidgetComponentProps } from "./";

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
  const { getWidgetById, isEditingWidget } = dashboardDetails?.widgetsStore ?? {};
  const widget = getWidgetById?.(widgetId);
  const { chart_type, data, fetchWidgetData, isConfigurationMissing } = widget ?? {};
  const isWidgetSelected = isEditingWidget === widgetId;
  const isWidgetConfigured = !isConfigurationMissing;

  console.log("Re-rendering widget root");

  useSWR(
    isWidgetConfigured && widgetId ? `WIDGET_DATA_${widgetId}` : null,
    isWidgetConfigured && widgetId ? () => fetchWidgetData?.() : null
  );

  let WidgetComponent: React.FC<TWidgetComponentProps> | null = null;
  switch (chart_type) {
    case EWidgetChartTypes.TEXT:
      WidgetComponent = DashboardTextWidget;
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

  if (!isWidgetConfigured) {
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
        isSelected: isWidgetSelected,
      })}
    >
      <DashboardWidgetHeader dashboardId={dashboardId} widget={widget} widgetRef={widgetRef} />
      <DashboardWidgetContent
        activeBreakpoint={activeBreakpoint}
        dashboardId={dashboardId}
        isDataAvailable={!!data}
        isDataEmpty={data?.data.length === 0}
        widget={widget}
      >
        <WidgetComponent widget={widget} />
      </DashboardWidgetContent>
    </div>
  );
});

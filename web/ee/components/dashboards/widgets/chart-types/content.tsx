// plane imports
import { EWidgetChartTypes } from "@plane/constants";
// plane web stores
import { DashboardWidgetInstance } from "@/plane-web/store/dashboards/widget";
// local imports
import { DashboardWidgetEmptyState } from "../empty-state";
import { DashboardWidgetLoader } from "../loader";
import { WIDGET_HEADER_HEIGHT, WIDGET_Y_SPACING } from ".";

type Props = {
  chartType: EWidgetChartTypes;
  children: React.ReactNode;
  className?: string;
  dashboardId: string;
  isDataAvailable: boolean;
  isDataEmpty: boolean;
  widget: DashboardWidgetInstance;
};

export const DashboardWidgetContent: React.FC<Props> = (props) => {
  const { chartType, children, className, dashboardId, isDataAvailable, isDataEmpty, widget } = props;

  return (
    <div
      className={className}
      style={{
        height: `calc(100% - ${WIDGET_HEADER_HEIGHT + WIDGET_Y_SPACING}px)`,
      }}
    >
      {isDataAvailable ? (
        isDataEmpty ? (
          <DashboardWidgetEmptyState dashboardId={dashboardId} widget={widget} />
        ) : (
          children
        )
      ) : (
        <DashboardWidgetLoader widget={widget} />
      )}
    </div>
  );
};

// plane imports
import { EWidgetGridBreakpoints } from "@plane/constants";
// plane web stores
import { DashboardWidgetInstance } from "@/plane-web/store/dashboards/widget";
// local imports
import { DashboardWidgetEmptyState } from "../empty-states/empty-state";
import { DashboardWidgetUpgradeRequiredState } from "../empty-states/upgrade-required-state";
import { DashboardWidgetLoader } from "../loader";
import { WIDGET_HEADER_HEIGHT, WIDGET_Y_SPACING } from ".";

type Props = {
  activeBreakpoint: EWidgetGridBreakpoints;
  children: React.ReactNode;
  className?: string;
  dashboardId: string;
  isDataAvailable: boolean;
  isDataEmpty: boolean;
  widget: DashboardWidgetInstance;
};

export const DashboardWidgetContent: React.FC<Props> = (props) => {
  const { activeBreakpoint, children, className, dashboardId, isDataAvailable, isDataEmpty, widget } = props;
  // derived values
  const { isWidgetAvailableInCurrentPlan } = widget;

  return (
    <div
      className={className}
      style={{
        height: `calc(100% - ${WIDGET_HEADER_HEIGHT + WIDGET_Y_SPACING}px)`,
      }}
    >
      {isWidgetAvailableInCurrentPlan ? (
        <>
          {isDataAvailable ? (
            isDataEmpty ? (
              <DashboardWidgetEmptyState
                activeBreakpoint={activeBreakpoint}
                dashboardId={dashboardId}
                widget={widget}
              />
            ) : (
              children
            )
          ) : (
            <DashboardWidgetLoader widget={widget} />
          )}
        </>
      ) : (
        <DashboardWidgetUpgradeRequiredState activeBreakpoint={activeBreakpoint} widget={widget} />
      )}
    </div>
  );
};

// nivo
import { BarTooltipProps } from "@nivo/bar";
import { IAnalyticsParams, IAnalyticsResponse } from "@plane/types";
import { DATE_KEYS } from "@/constants/analytics";
import { renderMonthAndYear } from "@/helpers/analytics.helper";
// types

type Props = {
  datum: BarTooltipProps<any>;
  analytics: IAnalyticsResponse;
  params: IAnalyticsParams;
};

export const CustomTooltip: React.FC<Props> = ({ datum, analytics, params }) => {
  let tooltipValue: string | number = "";

  const renderAssigneeName = (assigneeId: string): string => {
    const assignee = analytics.extras.assignee_details.find((a) => a.assignees__id === assigneeId);

    if (!assignee) return "No assignee";

    return assignee.assignees__display_name || "No assignee";
  };

  if (params.segment) {
    if (DATE_KEYS.includes(params.segment)) tooltipValue = renderMonthAndYear(datum.id);
    else if (params.segment === "labels__id") {
      const label = analytics.extras.label_details.find((l) => l.labels__id === datum.id);
      tooltipValue = label && label.labels__name ? label.labels__name : "None";
    } else if (params.segment === "state_id") {
      const state = analytics.extras.state_details.find((s) => s.state_id === datum.id);
      tooltipValue = state && state.state__name ? state.state__name : "None";
    } else if (params.segment === "issue_cycle__cycle_id") {
      const cycle = analytics.extras.cycle_details.find((c) => c.issue_cycle__cycle_id === datum.id);
      tooltipValue = cycle && cycle.issue_cycle__cycle__name ? cycle.issue_cycle__cycle__name : "None";
    } else if (params.segment === "issue_module__module_id") {
      const selectedModule = analytics.extras.module_details.find((m) => m.issue_module__module_id === datum.id);
      tooltipValue =
        selectedModule && selectedModule.issue_module__module__name
          ? selectedModule.issue_module__module__name
          : "None";
    } else tooltipValue = datum.id;
  } else {
    if (DATE_KEYS.includes(params.x_axis)) tooltipValue = datum.indexValue;
    else tooltipValue = datum.id === "count" ? "Issue count" : "Estimate";
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-80 p-2 text-xs">
      <span
        className="h-3 w-3 rounded"
        style={{
          backgroundColor: datum.color,
        }}
      />
      <span
        className={`font-medium text-custom-text-200 ${
          params.segment
            ? params.segment === "priority" || params.segment === "state__group"
              ? "capitalize"
              : ""
            : params.x_axis === "priority" || params.x_axis === "state__group"
              ? "capitalize"
              : ""
        }`}
      >
        {params.segment === "assignees__id" ? renderAssigneeName(tooltipValue.toString()) : tooltipValue}:
      </span>
      <span>{datum.value}</span>
    </div>
  );
};

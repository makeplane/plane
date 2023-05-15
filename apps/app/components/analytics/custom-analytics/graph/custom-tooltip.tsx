// nivo
import { BarTooltipProps } from "@nivo/bar";
import { DATE_KEYS } from "constants/analytics";
import { renderMonthAndYear } from "helpers/analytics.helper";
// types
import { IAnalyticsParams } from "types";

type Props = {
  datum: BarTooltipProps<any>;
  params: IAnalyticsParams;
};

export const CustomTooltip: React.FC<Props> = ({ datum, params }) => {
  let tooltipValue: string | number = "";

  if (params.segment) {
    if (DATE_KEYS.includes(params.segment)) tooltipValue = renderMonthAndYear(datum.id);
    else tooltipValue = datum.id;
  } else {
    if (DATE_KEYS.includes(params.x_axis)) tooltipValue = datum.indexValue;
    else tooltipValue = datum.id === "count" ? "Issue count" : "Effort";
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-brand-base bg-brand-base p-2 text-xs">
      <span
        className="h-3 w-3 rounded"
        style={{
          backgroundColor: datum.color,
        }}
      />
      <span
        className={`font-medium text-brand-secondary ${
          params.segment
            ? params.segment === "priority" || params.segment === "state__group"
              ? "capitalize"
              : ""
            : params.x_axis === "priority" || params.x_axis === "state__group"
            ? "capitalize"
            : ""
        }`}
      >
        {tooltipValue}:
      </span>
      <span>{datum.value}</span>
    </div>
  );
};

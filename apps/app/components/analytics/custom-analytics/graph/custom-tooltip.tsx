// nivo
import { BarTooltipProps } from "@nivo/bar";
// types
import { IAnalyticsParams } from "types";

type Props = {
  datum: BarTooltipProps<any>;
  params: IAnalyticsParams;
};

export const CustomTooltip: React.FC<Props> = ({ datum, params }) => (
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
      {params.segment ? datum.id : datum.id === "count" ? "Issue count" : "Effort"}:
    </span>
    <span>{datum.value}</span>
  </div>
);

import { format, startOfToday } from "date-fns";
import { TCycleEstimateSystemAdvanced } from "@plane/types";
import { Card, DoneState, ECardSpacing, InProgressState, PlannedState, PendingState } from "@plane/ui";
import { summaryDataFormatter } from "../formatter";

type Props = {
  active: boolean;
  payload: any; // TODO: fix type
  label: string;
  plotType: string;
  endDate: string;
  estimateType: TCycleEstimateSystemAdvanced;
};
const CustomTooltip = ({ active, payload, label, plotType, endDate, estimateType }: Props) => {
  if (active && payload && payload.length && label) {
    payload = payload[0]?.payload;
    const [year, month, day] = label?.split("-");
    const monthName = new Date(label).toLocaleString("default", { month: "short" });
    const isToday = payload.date === format(startOfToday(), "yyyy-MM-dd");
    const estimateTypeFormatter = summaryDataFormatter(estimateType);
    if (payload.date > endDate) return null;
    return (
      <Card className="flex flex-col" spacing={ECardSpacing.SM}>
        <p className="text-xs text-custom-text-300 border-b pb-2 flex gap-2">
          <span>{`${day} ${monthName}'${parseInt(year) % 100}`}</span>
          {isToday && (
            <svg x={-17} width="38" height="16px" xmlns="http://www.w3.org/2000/svg">
              <rect rx="2" width="100%" height="100%" fill="#667699" />
              <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="10px">
                Today
              </text>
            </svg>
          )}
        </p>
        <div className="flex flex-col space-y-2 pb-2 border-b">
          <span className="flex text-xs text-custom-text-300 gap-1">
            <PlannedState className="my-auto" width="14" height="14" />
            <span className="font-semibold">{estimateTypeFormatter(payload.scope)}</span>
            <span>scope</span>
          </span>
          <span className="flex text-xs text-custom-text-300 gap-1 items-center">
            <InProgressState className="my-auto items-center" width="14" height="14" />
            <span className="font-semibold">{estimateTypeFormatter(payload.started)}</span>
            <span> in-progress</span>
          </span>
          <span className="flex text-xs text-custom-text-300 gap-1 items-center ml-0.5">
            {plotType === "burndown" ? (
              <PendingState className="my-auto" width="12" height="12" />
            ) : (
              <DoneState className="my-auto" width="12" height="12" />
            )}
            <span className="font-semibold">
              {plotType === "burndown"
                ? estimateTypeFormatter(payload.scope - payload.completed)
                : estimateTypeFormatter(payload.completed)}
            </span>
            <span> {plotType === "burndown" ? "pending" : "done"}</span>
          </span>
        </div>
        <div className="flex flex-col space-y-2">
          <span className="flex text-xs text-custom-text-300 gap-1 items-center ml-0.5">
            {plotType !== "burndown" ? (
              <PendingState className="my-auto" width="12" height="12" />
            ) : (
              <DoneState className="my-auto" width="12" height="12" />
            )}
            <span className="font-semibold">
              {plotType !== "burndown"
                ? estimateTypeFormatter(payload.scope - payload.completed)
                : estimateTypeFormatter(payload.completed)}
            </span>
            <span> {plotType !== "burndown" ? "pending" : "done"}</span>
          </span>
        </div>
      </Card>
    );
  }

  return null;
};
export default CustomTooltip;

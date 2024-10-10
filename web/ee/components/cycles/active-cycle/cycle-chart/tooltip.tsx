import { Card, DoneState, ECardSpacing, InProgressState, PlannedState } from "@plane/ui";

type Props = {
  active: boolean;
  payload: any; // TODO: fix type
  label: string;
  plotType: string;
};
const CustomTooltip = ({ active, payload, label, plotType }: Props) => {
  if (active && payload && payload.length) {
    payload = payload[0]?.payload;
    const [year, month, day] = label?.split("-");
    const monthName = new Date(label).toLocaleString("default", { month: "short" });
    return (
      <Card className="flex flex-col" spacing={ECardSpacing.SM}>
        <p className="text-xs text-custom-text-400 border-b pb-2">{`${day} ${monthName}'${parseInt(year) % 100}`}</p>
        <div className="flex flex-col space-y-2">
          <span className="flex text-xs text-custom-text-300 gap-1">
            <PlannedState className="my-auto" width="14" height="14" />
            <span className="font-semibold">{Math.round(payload.ideal) || 0}</span>
            <span> planned</span>
          </span>
          <span className="flex text-xs text-custom-text-300 gap-1 items-center">
            <InProgressState className="my-auto items-center" width="14" height="14" />
            <span className="font-semibold">{payload.started || 0}</span>
            <span> in-progress</span>
          </span>
          <span className="flex text-xs text-custom-text-300 gap-1 items-center ml-0.5">
            <DoneState className="my-auto" width="12" height="12" />
            <span className="font-semibold">
              {plotType === "burndown" ? payload.scope - payload.completed || 0 : payload.completed || 0}
            </span>
            <span> {plotType === "burndown" ? "pending" : "done"}</span>
          </span>
        </div>
      </Card>
    );
  }

  return null;
};
export default CustomTooltip;

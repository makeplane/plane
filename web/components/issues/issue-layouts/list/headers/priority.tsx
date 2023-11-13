import { FC } from "react";
import { observer } from "mobx-react-lite";
import { AlertCircle, SignalHigh, SignalMedium, SignalLow, Ban } from "lucide-react";
// components
import { HeaderGroupByCard } from "./group-by-card";

export interface IPriorityHeader {
  column_id: string;
  column_value: any;
  issues_count: number;
}

const Icon = ({ priority }: any) => (
  <div className="w-full h-full">
    {priority === "urgent" ? (
      <div className="border border-red-500 bg-red-500 text-white w-full h-full overflow-hidden flex justify-center items-center rounded-sm">
        <AlertCircle size={14} strokeWidth={2} />
      </div>
    ) : priority === "high" ? (
      <div className="border border-red-500/20 bg-red-500/10 text-red-500 w-full h-full overflow-hidden flex justify-center items-center rounded-sm">
        <SignalHigh size={14} strokeWidth={2} className="pl-[3px]" />
      </div>
    ) : priority === "medium" ? (
      <div className="border border-orange-500/20 bg-orange-500/10 text-orange-500 w-full h-full overflow-hidden flex justify-center items-center rounded-sm">
        <SignalMedium size={14} strokeWidth={2} className="pl-[3px]" />
      </div>
    ) : priority === "low" ? (
      <div className="border border-green-500/20 bg-green-500/10 text-green-500 w-full h-full overflow-hidden flex justify-center items-center rounded-sm">
        <SignalLow size={14} strokeWidth={2} className="pl-[3px]" />
      </div>
    ) : (
      <div className="border border-custom-border-400/20 bg-custom-text-400/10 text-custom-text-400 w-full h-full overflow-hidden flex justify-center items-center rounded-sm">
        <Ban size={14} strokeWidth={2} />
      </div>
    )}
  </div>
);

export const PriorityHeader: FC<IPriorityHeader> = observer((props) => {
  const { column_id, column_value, issues_count } = props;

  const priority = column_value ?? null;

  return (
    <>
      {priority && (
        <HeaderGroupByCard
          icon={<Icon priority={priority?.key} />}
          title={priority?.title || ""}
          count={issues_count}
          issuePayload={{ priority: priority?.key }}
        />
      )}
    </>
  );
});

// mobx
import { observer } from "mobx-react-lite";
// lucide icons
import { AlertCircle, SignalHigh, SignalMedium, SignalLow, Ban } from "lucide-react";
// components
import { HeaderGroupByCard } from "./group-by-card";
import { HeaderSubGroupByCard } from "./sub-group-by-card";
// constants
import { issuePriorityByKey } from "constants/issue";

export interface IPriorityHeader {
  column_id: string;
  sub_group_by: string | null;
  group_by: string | null;
  header_type: "group_by" | "sub_group_by";
  issues_count: number;
  kanBanToggle: any;
  handleKanBanToggle: any;
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

export const PriorityHeader: React.FC<IPriorityHeader> = observer(
  ({ column_id, sub_group_by, group_by, header_type, issues_count, kanBanToggle, handleKanBanToggle }) => {
    const priority = column_id && issuePriorityByKey(column_id);

    return (
      <>
        {priority &&
          (sub_group_by && header_type === "sub_group_by" ? (
            <HeaderSubGroupByCard
              column_id={column_id}
              icon={<Icon priority={priority?.key} />}
              title={priority?.key || ""}
              count={issues_count}
              kanBanToggle={kanBanToggle}
              handleKanBanToggle={handleKanBanToggle}
            />
          ) : (
            <HeaderGroupByCard
              sub_group_by={sub_group_by}
              group_by={group_by}
              column_id={column_id}
              icon={<Icon priority={priority?.key} />}
              title={priority?.key || ""}
              count={issues_count}
              kanBanToggle={kanBanToggle}
              handleKanBanToggle={handleKanBanToggle}
            />
          ))}
      </>
    );
  }
);

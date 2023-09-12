import React from "react";
// lucide icons
import {
  AlertCircle,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Ban,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const PriorityIcons = ({ priority }: { priority: string }) => {
  if (priority === "urgent")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] border border-red-500 bg-red-500 text-white flex justify-center items-center">
        <AlertCircle size={14} strokeWidth={2} />
      </div>
    );
  if (priority === "high")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] border border-custom-border-300 text-red-500 flex justify-center items-center pl-1">
        <SignalHigh size={14} strokeWidth={2} />
      </div>
    );
  if (priority === "medium")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] border border-custom-border-300 text-orange-500 flex justify-center items-center pl-1">
        <SignalMedium size={14} strokeWidth={2} />
      </div>
    );
  if (priority === "low")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] border border-custom-border-300 text-green-500 flex justify-center items-center pl-1">
        <SignalLow size={14} strokeWidth={2} />
      </div>
    );
  return (
    <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] border border-custom-border-300 text-gray-500 flex justify-center items-center">
      <Ban size={14} strokeWidth={2} />
    </div>
  );
};

export const FilterPriority = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore, issueView: issueStore } = store;

  const [allFiltersToggle, setAllFiltersToggle] = React.useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-2 p-[6px] pb-2">
        <div className="text-gray-500 text-sm text-custom-text-300 font-medium">Priority</div>
        <div
          className="flex-shrink-0 w-[20px] h-[20px] flex justify-center items-center rounded-sm transition-all hover:bg-custom-border-100 cursor-pointer"
          onClick={() => setAllFiltersToggle(!allFiltersToggle)}
        >
          {allFiltersToggle ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>
      <div className="space-y-[2px]">
        {issueFilterStore?.issueRenderFilters?.priority &&
          issueFilterStore?.issueRenderFilters?.priority.length > 0 &&
          issueFilterStore?.issueRenderFilters?.priority.map((_priority) => (
            <div
              key={_priority?.key}
              className={`flex items-center gap-2 cursor-pointer rounded-sm p-[6px] py-[5px] transition-all ${
                false ? `bg-custom-border-100` : `hover:bg-custom-border-100`
              }`}
            >
              <PriorityIcons priority={_priority.key} />
              <div className="hyphens-auto line-clamp-2 text-custom-text-200 text-sm w-full">
                {_priority.title}
              </div>
              <div className="ml-auto flex-shrink-0 w-[20px] h-[20px] flex justify-center items-center rounded-sm text-custom-text-200">
                {false && <Check size={14} />}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
});

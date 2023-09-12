import React from "react";
// lucide icons
import {
  AlertCircleIcon,
  SignalHighIcon,
  SignalMediumIcon,
  SignalLowIcon,
  BanIcon,
  CheckIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const StateGroupIcons = ({ stateGroup }: { stateGroup: string }) => {
  if (stateGroup === "cancelled")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] border border-red-500 bg-red-500 text-white flex justify-center items-center">
        <AlertCircleIcon size={14} strokeWidth={2} />
      </div>
    );
  if (stateGroup === "completed")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] border border-custom-border-300 text-red-500 flex justify-center items-center pl-1">
        <SignalHighIcon size={14} strokeWidth={2} />
      </div>
    );
  if (stateGroup === "started")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] border border-custom-border-300 text-orange-500 flex justify-center items-center pl-1">
        <SignalMediumIcon size={14} strokeWidth={2} />
      </div>
    );
  if (stateGroup === "unstarted")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] border border-custom-border-300 text-green-500 flex justify-center items-center pl-1">
        <SignalLowIcon size={14} strokeWidth={2} />
      </div>
    );
  return (
    <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] border border-custom-border-300 text-gray-500 flex justify-center items-center">
      <BanIcon size={14} strokeWidth={2} />
    </div>
  );
};

export const FilterStateGroup = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore, issueView: issueStore } = store;

  const [allFiltersToggle, setAllFiltersToggle] = React.useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-2 p-[6px] pb-2">
        <div className="text-gray-500 text-sm text-custom-text-300 font-medium">State Group</div>
        <div
          className="flex-shrink-0 w-[20px] h-[20px] flex justify-center items-center rounded-sm transition-all hover:bg-custom-border-100 cursor-pointer"
          onClick={() => setAllFiltersToggle(!allFiltersToggle)}
        >
          {allFiltersToggle ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>
      <div className="space-y-[2px]">
        {issueFilterStore?.issueRenderFilters?.state_group &&
          issueFilterStore?.issueRenderFilters?.state_group.length > 0 &&
          issueFilterStore?.issueRenderFilters?.state_group.map((_stateGroup) => (
            <div
              key={_stateGroup?.key}
              className={`flex items-center gap-2 cursor-pointer rounded-sm p-[6px] py-[5px] transition-all ${
                false ? `bg-custom-border-100` : `hover:bg-custom-border-100`
              }`}
            >
              <StateGroupIcons stateGroup={_stateGroup.key} />
              <div className="hyphens-auto line-clamp-2 text-custom-text-200 text-sm w-full">
                {_stateGroup.title}
              </div>
              <div className="ml-auto flex-shrink-0 w-[20px] h-[20px] flex justify-center items-center rounded-sm text-custom-text-200">
                <CheckIcon size={14} />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
});

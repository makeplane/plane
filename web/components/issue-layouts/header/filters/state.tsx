import React from "react";
// lucide icons
import { CheckIcon, ChevronDown, ChevronUp } from "lucide-react";
// components
import { StateGroupIcons } from "./state-group";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const FilterState = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore, issueView: issueStore } = store;

  const [allFiltersToggle, setAllFiltersToggle] = React.useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-2 p-[6px] pb-2">
        <div className="text-gray-500 text-sm text-custom-text-300 font-medium">State</div>
        <div
          className="flex-shrink-0 w-[20px] h-[20px] flex justify-center items-center rounded-sm transition-all hover:bg-custom-border-100 cursor-pointer"
          onClick={() => setAllFiltersToggle(!allFiltersToggle)}
        >
          {allFiltersToggle ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>
      <div className="space-y-[2px]">
        {issueFilterStore?.projectStates &&
          issueFilterStore?.projectStates.length > 0 &&
          issueFilterStore?.projectStates.map((_state) => (
            <div
              key={_state?.key}
              className={`flex items-center gap-2 cursor-pointer rounded-sm p-[6px] py-[5px] transition-all ${
                false ? `bg-custom-border-100` : `hover:bg-custom-border-100`
              }`}
            >
              <StateGroupIcons stateGroup={_state.group} />
              <div className="hyphens-auto line-clamp-2 text-custom-text-200 text-sm w-full">
                {_state?.name}
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

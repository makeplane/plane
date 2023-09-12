import React from "react";
// lucide icons
import { AlertCircle, SignalHigh, SignalMedium, SignalLow, Ban, Check } from "lucide-react";
// components
import { FilterHeader } from "../helpers/filter-header";
import { FilterOption } from "../helpers/filter-option";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const PriorityIcons = ({
  priority,
  size = 14,
  strokeWidth = 2,
}: {
  priority: string;
  size?: number;
  strokeWidth?: number;
}) => {
  if (priority === "urgent")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] border border-red-500 bg-red-500 text-white flex justify-center items-center">
        <AlertCircle size={size} strokeWidth={strokeWidth} />
      </div>
    );
  if (priority === "high")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] border border-custom-border-300 text-red-500 flex justify-center items-center pl-1">
        <SignalHigh size={size} strokeWidth={strokeWidth} />
      </div>
    );
  if (priority === "medium")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] border border-custom-border-300 text-orange-500 flex justify-center items-center pl-1">
        <SignalMedium size={size} strokeWidth={strokeWidth} />
      </div>
    );
  if (priority === "low")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] border border-custom-border-300 text-green-500 flex justify-center items-center pl-1">
        <SignalLow size={size} strokeWidth={strokeWidth} />
      </div>
    );
  return (
    <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] border border-custom-border-300 text-gray-500 flex justify-center items-center">
      <Ban size={size} strokeWidth={strokeWidth} />
    </div>
  );
};

export const FilterPriority = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore, issueView: issueStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(false);

  return (
    <div>
      <FilterHeader
        title={"Priority"}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={setPreviewEnabled}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {issueFilterStore?.issueRenderFilters?.priority &&
            issueFilterStore?.issueRenderFilters?.priority.length > 0 &&
            issueFilterStore?.issueRenderFilters?.priority.map((_priority) => (
              <FilterOption
                key={_priority?.key}
                isChecked={false}
                icon={<PriorityIcons priority={_priority.key} />}
                title={_priority.title}
              />
            ))}
        </div>
      )}
    </div>
  );
});

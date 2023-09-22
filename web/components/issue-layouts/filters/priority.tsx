import React, { useState } from "react";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader } from "../helpers/filter-header";
import { FilterOption } from "../helpers/filter-option";
// icons
import { AlertCircle, SignalHigh, SignalMedium, SignalLow, Ban } from "lucide-react";
// constants
import { ISSUE_PRIORITIES } from "constants/issue";

const PriorityIcons = ({
  priority,
  size = 12,
  strokeWidth = 1.5,
}: {
  priority: string;
  size?: number;
  strokeWidth?: number;
}) => {
  if (priority === "urgent")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-5 h-5 border border-red-500 bg-red-500 text-white flex justify-center items-center">
        <AlertCircle size={size} strokeWidth={strokeWidth} />
      </div>
    );
  if (priority === "high")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-5 h-5 border border-custom-border-200 text-red-500 flex justify-center items-center pl-1">
        <SignalHigh size={size} strokeWidth={strokeWidth} />
      </div>
    );
  if (priority === "medium")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-5 h-5 border border-custom-border-200 text-orange-500 flex justify-center items-center pl-1">
        <SignalMedium size={size} strokeWidth={strokeWidth} />
      </div>
    );
  if (priority === "low")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-5 h-5 border border-custom-border-200 text-green-500 flex justify-center items-center pl-1">
        <SignalLow size={size} strokeWidth={strokeWidth} />
      </div>
    );
  return (
    <div className="flex-shrink-0 rounded-sm overflow-hidden w-5 h-5 border border-custom-border-200 text-custom-text-400 flex justify-center items-center">
      <Ban size={size} strokeWidth={strokeWidth} />
    </div>
  );
};

type Props = { onClick: (stateId: string) => void };

export const FilterPriority: React.FC<Props> = observer((props) => {
  const { onClick } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const store = useMobxStore();
  const { issueFilter: issueFilterStore } = store;

  return (
    <div>
      <FilterHeader
        title={`Priority (${issueFilterStore.userFilters?.priority?.length ?? 0})`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-1 pt-1">
          {ISSUE_PRIORITIES.map((priority) => (
            <FilterOption
              key={priority.key}
              isChecked={issueFilterStore.userFilters?.priority?.includes(priority.key) ? true : false}
              onClick={() => onClick(priority.key)}
              icon={<PriorityIcons priority={priority.key} />}
              title={priority.title}
            />
          ))}
        </div>
      )}
    </div>
  );
});

import React, { useState } from "react";
import { observer } from "mobx-react-lite";

// components
import { FilterHeader, FilterOption } from "components/issues";
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

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  itemsToRender: number;
  searchQuery: string;
  viewButtons: React.ReactNode;
};

export const FilterPriority: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, itemsToRender, searchQuery, viewButtons } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const filteredOptions = ISSUE_PRIORITIES.filter((p) => p.key.includes(searchQuery.toLowerCase()));

  return (
    <>
      <FilterHeader
        title={`Priority${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions.length > 0 ? (
            <>
              {filteredOptions.slice(0, itemsToRender).map((priority) => (
                <FilterOption
                  key={priority.key}
                  isChecked={appliedFilters?.includes(priority.key) ? true : false}
                  onClick={() => handleUpdate(priority.key)}
                  icon={<PriorityIcons priority={priority.key} />}
                  title={priority.title}
                />
              ))}
              {viewButtons}
            </>
          ) : (
            <p className="text-xs text-custom-text-400 italic">No matches found</p>
          )}
        </div>
      )}
    </>
  );
});

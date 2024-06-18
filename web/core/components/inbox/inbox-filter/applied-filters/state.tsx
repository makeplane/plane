"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { X } from "lucide-react";
import { StateGroupIcon } from "@plane/ui";
// hooks
import { useProjectInbox, useProjectState } from "@/hooks/store";

export const InboxIssueAppliedFiltersState: FC = observer(() => {
  // hooks
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  const { getStateById } = useProjectState();
  // derived values
  const filteredValues = inboxFilters?.state || [];
  const currentOptionDetail = (stateId: string) => getStateById(stateId) || undefined;

  const handleFilterValue = (value: string): string[] =>
    filteredValues?.includes(value) ? filteredValues.filter((v) => v !== value) : [...filteredValues, value];

  const clearFilter = () => handleInboxIssueFilters("state", undefined);

  if (filteredValues.length === 0) return <></>;
  return (
    <div className="relative flex flex-wrap items-center gap-2 rounded-md border border-custom-border-200 px-2 py-1">
      <div className="text-xs text-custom-text-200">State</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <div key={value} className="relative flex items-center gap-1 rounded bg-custom-background-80 p-1 text-xs">
            <div className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden">
              <StateGroupIcon color={optionDetail.color} stateGroup={optionDetail.group} height="12px" width="12px" />
            </div>
            <div className="text-xs truncate">{optionDetail?.name}</div>
            <div
              className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden cursor-pointer text-custom-text-300 hover:text-custom-text-200 transition-all"
              onClick={() => handleInboxIssueFilters("state", handleFilterValue(optionDetail?.id))}
            >
              <X className={`w-3 h-3`} />
            </div>
          </div>
        );
      })}

      <div
        className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden cursor-pointer text-custom-text-300 hover:text-custom-text-200 transition-all"
        onClick={clearFilter}
      >
        <X className={`w-3 h-3`} />
      </div>
    </div>
  );
});

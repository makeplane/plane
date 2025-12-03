import type { FC } from "react";
import { observer } from "mobx-react";
import { EIconSize } from "@plane/constants";
import { StateGroupIcon, CloseIcon } from "@plane/propel/icons";
import { Tag } from "@plane/ui";
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { useProjectState } from "@/hooks/store/use-project-state";

export const InboxIssueAppliedFiltersState = observer(function InboxIssueAppliedFiltersState() {
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
    <Tag>
      <div className="text-11 text-secondary">State</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <div key={value} className="relative flex items-center gap-1 rounded-sm bg-layer-1 p-1 text-11">
            <div className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden">
              <StateGroupIcon color={optionDetail.color} stateGroup={optionDetail.group} size={EIconSize.SM} />
            </div>
            <div className="text-11 truncate">{optionDetail?.name}</div>
            <div
              className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden cursor-pointer text-tertiary hover:text-secondary transition-all"
              onClick={() => handleInboxIssueFilters("state", handleFilterValue(optionDetail?.id))}
            >
              <CloseIcon className={`w-3 h-3`} />
            </div>
          </div>
        );
      })}

      <div
        className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden cursor-pointer text-tertiary hover:text-secondary transition-all"
        onClick={clearFilter}
      >
        <CloseIcon className={`w-3 h-3`} />
      </div>
    </Tag>
  );
});

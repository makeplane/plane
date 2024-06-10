"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { X } from "lucide-react";
import { TInboxIssueFilterMemberKeys } from "@plane/types";
import { Avatar } from "@plane/ui";
// hooks
import { useMember, useProjectInbox } from "@/hooks/store";

type InboxIssueAppliedFiltersMember = {
  filterKey: TInboxIssueFilterMemberKeys;
  label: string;
};

export const InboxIssueAppliedFiltersMember: FC<InboxIssueAppliedFiltersMember> = observer((props) => {
  const { filterKey, label } = props;
  // hooks
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  const { getUserDetails } = useMember();
  // derived values
  const filteredValues = inboxFilters?.[filterKey] || [];
  const currentOptionDetail = (memberId: string) => getUserDetails(memberId) || undefined;

  const handleFilterValue = (value: string): string[] =>
    filteredValues?.includes(value) ? filteredValues.filter((v) => v !== value) : [...filteredValues, value];

  const clearFilter = () => handleInboxIssueFilters(filterKey, undefined);

  if (filteredValues.length === 0) return <></>;
  return (
    <div className="relative flex flex-wrap items-center gap-2 rounded-md border border-custom-border-200 px-2 py-1">
      <div className="text-xs text-custom-text-200">{label}</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <div key={value} className="relative flex items-center gap-1 rounded bg-custom-background-80 p-1 text-xs">
            <div className="flex-shrink-0 relative flex justify-center items-center overflow-hidden">
              <Avatar name={optionDetail.display_name} src={optionDetail.avatar} showTooltip={false} size="sm" />
            </div>
            <div className="text-xs truncate">{optionDetail?.display_name}</div>
            <div
              className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden cursor-pointer text-custom-text-300 hover:text-custom-text-200 transition-all"
              onClick={() => handleInboxIssueFilters(filterKey, handleFilterValue(value))}
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

import { FC } from "react";
import { observer } from "mobx-react";
import { X } from "lucide-react";
import { TInboxIssueStatus } from "@plane/types";
// constants
import { INBOX_STATUS } from "@/constants/inbox";
// hooks
import { useProjectInbox } from "@/hooks/store";

export const InboxIssueAppliedFiltersStatus: FC = observer(() => {
  // hooks
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  // derived values
  const filteredValues = inboxFilters?.status || [];
  const currentOptionDetail = (status: TInboxIssueStatus) => INBOX_STATUS.find((s) => s.status === status) || undefined;

  const handleFilterValue = (value: TInboxIssueStatus): TInboxIssueStatus[] =>
    filteredValues?.includes(value) ? filteredValues.filter((v) => v !== value) : [...filteredValues, value];

  if (filteredValues.length === 0) return <></>;
  return (
    <div className="relative flex flex-wrap items-center gap-2 rounded-md border border-custom-border-200 px-2 py-1">
      <div className="text-xs text-custom-text-200">Status</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <div key={value} className="relative flex items-center gap-1 rounded bg-custom-background-80 p-1 text-xs">
            <div className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden">
              <optionDetail.icon className={`w-3 h-3 ${optionDetail?.textColor(false)}`} />
            </div>
            <div className="text-xs truncate">{optionDetail?.title}</div>
            {handleFilterValue(optionDetail?.status).length >= 1 && (
              <div
                className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden cursor-pointer text-custom-text-300 hover:text-custom-text-200 transition-all"
                onClick={() => handleInboxIssueFilters("status", handleFilterValue(optionDetail?.status))}
              >
                <X className={`w-3 h-3`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

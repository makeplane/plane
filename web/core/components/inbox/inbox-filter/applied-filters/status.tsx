import { FC } from "react";
import { observer } from "mobx-react";
import { X } from "lucide-react";
import { INBOX_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TInboxIssueStatus } from "@plane/types";
// constants
import { Tag } from "@plane/ui";
// hooks
import { useProjectInbox } from "@/hooks/store";
import { InboxStatusIcon } from "../../inbox-status-icon";

export const InboxIssueAppliedFiltersStatus: FC = observer(() => {
  // hooks
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  const { t } = useTranslation();
  // derived values
  const filteredValues = inboxFilters?.status || [];
  const currentOptionDetail = (status: TInboxIssueStatus) => INBOX_STATUS.find((s) => s.status === status) || undefined;

  const handleFilterValue = (value: TInboxIssueStatus): TInboxIssueStatus[] =>
    filteredValues?.includes(value) ? filteredValues.filter((v) => v !== value) : [...filteredValues, value];

  if (filteredValues.length === 0) return <></>;
  return (
    <Tag>
      <div className="text-xs text-custom-text-200">Status</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <div key={value} className="relative flex items-center gap-1 rounded bg-custom-background-80 p-1 text-xs">
            <div className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden">
              <InboxStatusIcon type={optionDetail?.status} />
            </div>
            <div className="text-xs truncate">{t(optionDetail?.i18n_title)}</div>
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
    </Tag>
  );
});

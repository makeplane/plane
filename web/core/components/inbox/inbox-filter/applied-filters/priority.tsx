"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { X } from "lucide-react";
import { ISSUE_PRIORITIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TIssuePriorities } from "@plane/types";
import { PriorityIcon, Tag } from "@plane/ui";
// hooks
import { useProjectInbox } from "@/hooks/store";

export const InboxIssueAppliedFiltersPriority: FC = observer(() => {
  // hooks
  const { t } = useTranslation();
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  // derived values
  const filteredValues = inboxFilters?.priority || [];
  const currentOptionDetail = (priority: TIssuePriorities) =>
    ISSUE_PRIORITIES.find((p) => p.key === priority) || undefined;

  const handleFilterValue = (value: TIssuePriorities): TIssuePriorities[] =>
    filteredValues?.includes(value) ? filteredValues.filter((v) => v !== value) : [...filteredValues, value];

  const clearFilter = () => handleInboxIssueFilters("priority", undefined);

  if (filteredValues.length === 0) return <></>;
  return (
    <Tag>
      <div className="text-xs text-custom-text-200">{t("common.priority")}</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <div key={value} className="relative flex items-center gap-1 rounded bg-custom-background-80 p-1 text-xs">
            <div className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden">
              <PriorityIcon priority={optionDetail.key} className="h-3 w-3" />
            </div>
            <div className="text-xs truncate">{optionDetail?.title}</div>
            <div
              className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden cursor-pointer text-custom-text-300 hover:text-custom-text-200 transition-all"
              onClick={() => handleInboxIssueFilters("priority", handleFilterValue(optionDetail?.key))}
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
    </Tag>
  );
});

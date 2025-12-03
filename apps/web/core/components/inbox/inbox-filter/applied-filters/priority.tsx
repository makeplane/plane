import type { FC } from "react";
import { observer } from "mobx-react";
import { ISSUE_PRIORITIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PriorityIcon, CloseIcon } from "@plane/propel/icons";
import type { TIssuePriorities } from "@plane/types";
import { Tag } from "@plane/ui";
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";

export const InboxIssueAppliedFiltersPriority = observer(function InboxIssueAppliedFiltersPriority() {
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
      <div className="text-11 text-secondary">{t("common.priority")}</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <div key={value} className="relative flex items-center gap-1 rounded-sm bg-layer-1 p-1 text-11">
            <div className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden">
              <PriorityIcon priority={optionDetail.key} className="h-3 w-3" />
            </div>
            <div className="text-11 truncate">{optionDetail?.title}</div>
            <div
              className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden cursor-pointer text-tertiary hover:text-secondary transition-all"
              onClick={() => handleInboxIssueFilters("priority", handleFilterValue(optionDetail?.key))}
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

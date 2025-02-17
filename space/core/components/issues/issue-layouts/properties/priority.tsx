"use client";

import { useTranslation } from "@plane/i18n";
// types
import { TIssuePriorities } from "@plane/types";
import { Tooltip } from "@plane/ui";
// constants
import { getIssuePriorityFilters } from "@plane/utils";

export const IssueBlockPriority = ({
  priority,
  shouldShowName = false,
}: {
  priority: TIssuePriorities | null;
  shouldShowName?: boolean;
}) => {
  // hooks
  const { t } = useTranslation();
  const priority_detail = priority != null ? getIssuePriorityFilters(priority) : null;

  if (priority_detail === null) return <></>;

  return (
    <Tooltip tooltipHeading="Priority" tooltipContent={t(priority_detail?.titleTranslationKey || "")}>
      <div className="flex items-center relative w-full h-full">
        <div className={`grid h-5 w-5 place-items-center rounded border-[0.5px] gap-2 ${priority_detail?.className}`}>
          <span className="material-symbols-rounded text-sm">{priority_detail?.icon}</span>
        </div>
        {shouldShowName && <span className="pl-2 text-sm">{t(priority_detail?.titleTranslationKey || "")}</span>}
      </div>
    </Tooltip>
  );
};

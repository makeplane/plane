/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { ISSUE_PRIORITIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PriorityIcon } from "@plane/propel/icons";
import { CloseOutline } from "@makeplane/propel/icons";
import type { TIssuePriorities } from "@plane/types";
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
    <div className="my-auto flex min-h-9 cursor-pointer flex-wrap items-center gap-1.5 rounded-md border border-subtle p-1.5 text-11 text-tertiary capitalize hover:text-secondary">
      <div className="text-11 text-secondary">{t("common.priority")}</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <div key={value} className="relative flex items-center gap-1 rounded-sm bg-layer-1 p-1 text-11">
            <div className="relative flex h-3 w-3 flex-shrink-0 items-center justify-center overflow-hidden">
              <PriorityIcon priority={optionDetail.key} className="h-3 w-3" />
            </div>
            <div className="truncate text-11">{optionDetail?.title}</div>
            <div
              className="relative flex h-3 w-3 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden text-tertiary transition-all hover:text-secondary"
              onClick={() => handleInboxIssueFilters("priority", handleFilterValue(optionDetail?.key))}
            >
              <CloseOutline className={`h-3 w-3`} />
            </div>
          </div>
        );
      })}

      <div
        className="relative flex h-3 w-3 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden text-tertiary transition-all hover:text-secondary"
        onClick={clearFilter}
      >
        <CloseOutline className={`h-3 w-3`} />
      </div>
    </div>
  );
});

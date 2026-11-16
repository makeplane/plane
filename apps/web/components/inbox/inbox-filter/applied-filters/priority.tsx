/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { ISSUE_PRIORITIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PriorityIcon } from "@plane/blocks/icons";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { CloseOutline } from "@makeplane/propel/icons";
import type { TIssuePriorities } from "@plane/types";
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { APPLIED_FILTER_GROUP_CLASSNAME, RemovableChip } from "@/components/common/removable-chip";

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
    <div className={APPLIED_FILTER_GROUP_CLASSNAME}>
      <div className="text-caption-sm-regular text-secondary">{t("common.priority")}</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <RemovableChip
            key={value}
            variant="soft"
            icon={<PriorityIcon priority={optionDetail.key} className="h-3 w-3" />}
            label={optionDetail.title}
            ariaLabel={optionDetail.title}
            onRemove={() => handleInboxIssueFilters("priority", handleFilterValue(optionDetail?.key))}
          />
        );
      })}

      <IconButton
        type="button"
        variant="ghost"
        size="xs"
        aria-label={`${t("aria_labels.common.remove")}: ${t("common.priority")}`}
        onClick={clearFilter}
        icon={<Icon icon={CloseOutline} />}
      />
    </div>
  );
});

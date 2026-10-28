/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { INBOX_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TInboxIssueStatus } from "@plane/types";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { InboxStatusIcon } from "../../inbox-status-icon";
import { APPLIED_FILTER_GROUP_CLASSNAME, RemovableChip } from "@/components/common/removable-chip";

export const InboxIssueAppliedFiltersStatus = observer(function InboxIssueAppliedFiltersStatus() {
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
    <div className={APPLIED_FILTER_GROUP_CLASSNAME}>
      <div className="text-caption-sm-regular text-secondary">Status</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <RemovableChip
            key={value}
            variant="soft"
            icon={<InboxStatusIcon type={optionDetail?.status} className="size-3" />}
            label={t(optionDetail?.i18n_title)}
            ariaLabel={t(optionDetail.i18n_title)}
            onRemove={
              handleFilterValue(optionDetail?.status).length >= 1
                ? () => handleInboxIssueFilters("status", handleFilterValue(optionDetail?.status))
                : undefined
            }
          />
        );
      })}
    </div>
  );
});

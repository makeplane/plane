/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
// hooks
import { CloseOutline } from "@makeplane/propel/icons";
import { useLabel } from "@/hooks/store/use-label";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { APPLIED_FILTER_GROUP_CLASSNAME, RemovableChip } from "@/components/common/removable-chip";

export const InboxIssueAppliedFiltersLabel = observer(function InboxIssueAppliedFiltersLabel() {
  // hooks
  const { t } = useTranslation();
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  const { getLabelById } = useLabel();
  // derived values
  const filteredValues = inboxFilters?.labels || [];
  const currentOptionDetail = (labelId: string) => getLabelById(labelId) || undefined;

  const handleFilterValue = (value: string): string[] =>
    filteredValues?.includes(value) ? filteredValues.filter((v) => v !== value) : [...filteredValues, value];

  const clearFilter = () => handleInboxIssueFilters("labels", undefined);

  if (filteredValues.length === 0) return <></>;
  return (
    <div className={APPLIED_FILTER_GROUP_CLASSNAME}>
      <div className="text-caption-sm-regular text-secondary">Label</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <RemovableChip
            key={value}
            variant="soft"
            icon={<span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: optionDetail.color }} />}
            label={optionDetail.name}
            ariaLabel={optionDetail.name}
            onRemove={() => handleInboxIssueFilters("labels", handleFilterValue(value))}
          />
        );
      })}

      <IconButton
        type="button"
        variant="ghost"
        size="xs"
        aria-label={`${t("aria_labels.common.remove")}: Label`}
        onClick={clearFilter}
        icon={<Icon icon={CloseOutline} />}
      />
    </div>
  );
});

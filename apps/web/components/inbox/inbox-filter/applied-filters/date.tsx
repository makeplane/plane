/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { PAST_DURATION_FILTER_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { CloseOutline } from "@makeplane/propel/icons";
import type { TInboxIssueFilterDateKeys } from "@plane/types";
import { renderFormattedDate } from "@plane/utils";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { APPLIED_FILTER_GROUP_CLASSNAME, RemovableChip } from "@/components/common/removable-chip";

type InboxIssueAppliedFiltersDateProps = {
  filterKey: TInboxIssueFilterDateKeys;
  label: string;
};

export const InboxIssueAppliedFiltersDate = observer(function InboxIssueAppliedFiltersDate(
  props: InboxIssueAppliedFiltersDateProps
) {
  const { filterKey, label } = props;
  // hooks
  const { t } = useTranslation();
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  // derived values
  const filteredValues = inboxFilters?.[filterKey] || [];
  const currentOptionDetail = (date: string) => {
    const currentDate = PAST_DURATION_FILTER_OPTIONS.find((d) => d.value === date);
    if (currentDate) return currentDate;
    const dateSplit = date.split(";");
    return {
      name: `${dateSplit[1].charAt(0).toUpperCase() + dateSplit[1].slice(1)} ${renderFormattedDate(dateSplit[0])}`,
      value: date,
    };
  };

  const handleFilterValue = (value: string): string[] =>
    filteredValues?.includes(value) ? filteredValues.filter((v) => v !== value) : [...filteredValues, value];

  const clearFilter = () => handleInboxIssueFilters(filterKey, undefined);

  if (filteredValues.length === 0) return <></>;
  return (
    <div className={APPLIED_FILTER_GROUP_CLASSNAME}>
      <div className="text-caption-sm-regular text-secondary">{label}</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <RemovableChip
            key={value}
            variant="soft"
            label={optionDetail.name}
            ariaLabel={optionDetail.name}
            onRemove={() => handleInboxIssueFilters(filterKey, handleFilterValue(optionDetail?.value))}
          />
        );
      })}

      <IconButton
        type="button"
        variant="ghost"
        size="xs"
        aria-label={label ? `${t("aria_labels.common.remove")}: ${label}` : t("aria_labels.common.remove")}
        onClick={clearFilter}
        icon={<Icon icon={CloseOutline} />}
      />
    </div>
  );
});

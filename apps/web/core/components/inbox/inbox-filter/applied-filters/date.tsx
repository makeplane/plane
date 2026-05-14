/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { PAST_DURATION_FILTER_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CloseIcon } from "@plane/propel/icons";
import type { TInboxIssueFilterDateKeys } from "@plane/types";
// helpers
import { Tag } from "@plane/ui";
import { renderFormattedDate } from "@plane/utils";
// constants
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";

type TInboxIssueAppliedFiltersDate = {
  filterKey: TInboxIssueFilterDateKeys;
  label: string;
};

const PAST_DURATION_FILTER_I18N_KEYS: Record<string, string> = {
  today: "localized_ui.inbox.filters.date_options.today",
  yesterday: "localized_ui.inbox.filters.date_options.yesterday",
  last_7_days: "localized_ui.inbox.filters.date_options.last_7_days",
  last_30_days: "localized_ui.inbox.filters.date_options.last_30_days",
};

const CUSTOM_DATE_OPERATOR_I18N_KEYS: Record<string, string> = {
  after: "localized_ui.inbox.filters.date_operators.after",
  before: "localized_ui.inbox.filters.date_operators.before",
};

export const InboxIssueAppliedFiltersDate = observer(function InboxIssueAppliedFiltersDate(
  props: TInboxIssueAppliedFiltersDate
) {
  const { filterKey, label } = props;
  // hooks
  const { t } = useTranslation();
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  // derived values
  const filteredValues = inboxFilters?.[filterKey] || [];
  const currentOptionDetail = (date: string) => {
    const currentDate = PAST_DURATION_FILTER_OPTIONS.find((d) => d.value === date);
    if (currentDate)
      return {
        ...currentDate,
        name: t(PAST_DURATION_FILTER_I18N_KEYS[currentDate.value]),
      };
    const dateSplit = date.split(";");
    const operator = dateSplit[1];
    return {
      name: `${t(CUSTOM_DATE_OPERATOR_I18N_KEYS[operator])} ${renderFormattedDate(dateSplit[0])}`,
      value: date,
    };
  };

  const handleFilterValue = (value: string): string[] =>
    filteredValues?.includes(value) ? filteredValues.filter((v) => v !== value) : [...filteredValues, value];

  const clearFilter = () => handleInboxIssueFilters(filterKey, undefined);

  if (filteredValues.length === 0) return <></>;
  return (
    <Tag>
      <div className="text-11 text-secondary">{label}</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <div key={value} className="relative flex items-center gap-1 rounded-sm bg-layer-1 p-1 text-11">
            <div className="truncate text-11">{optionDetail?.name}</div>
            <button
              type="button"
              className="relative flex h-3 w-3 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden text-tertiary transition-all hover:text-secondary"
              onClick={() => handleInboxIssueFilters(filterKey, handleFilterValue(optionDetail?.value))}
            >
              <CloseIcon className={`h-3 w-3`} />
            </button>
          </div>
        );
      })}

      <button
        type="button"
        className="relative flex h-3 w-3 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden text-tertiary transition-all hover:text-secondary"
        onClick={clearFilter}
      >
        <CloseIcon className={`h-3 w-3`} />
      </button>
    </Tag>
  );
});

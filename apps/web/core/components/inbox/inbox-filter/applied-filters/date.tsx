/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";
import { observer } from "mobx-react";
import { PAST_DURATION_FILTER_OPTIONS } from "@plane/constants";
import { CloseIcon } from "@plane/propel/icons";
import type { TInboxIssueFilterDateKeys } from "@plane/types";
// helpers
import { Tag } from "@plane/ui";
import { renderFormattedDate } from "@plane/utils";
// constants
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";

type InboxIssueAppliedFiltersDate = {
  filterKey: TInboxIssueFilterDateKeys;
  label: string;
};

export const InboxIssueAppliedFiltersDate = observer(function InboxIssueAppliedFiltersDate(
  props: InboxIssueAppliedFiltersDate
) {
  const { filterKey, label } = props;
  // hooks
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
    <Tag>
      <div className="text-11 text-secondary">{label}</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <div key={value} className="relative flex items-center gap-1 rounded-sm bg-layer-1 p-1 text-11">
            <div className="truncate text-11">{optionDetail?.name}</div>
            <div
              className="relative flex h-3 w-3 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden text-tertiary transition-all hover:text-secondary"
              onClick={() => handleInboxIssueFilters(filterKey, handleFilterValue(optionDetail?.value))}
            >
              <CloseIcon className={`h-3 w-3`} />
            </div>
          </div>
        );
      })}

      <div
        className="relative flex h-3 w-3 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden text-tertiary transition-all hover:text-secondary"
        onClick={clearFilter}
      >
        <CloseIcon className={`h-3 w-3`} />
      </div>
    </Tag>
  );
});

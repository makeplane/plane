/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { PAST_DURATION_FILTER_OPTIONS } from "@plane/constants";
import type { TInboxIssueFilterDateKeys } from "@plane/types";
// components
import { DateFilterSubmenu, isCustomDateFilterValue } from "@/components/common/filters/date-filter-submenu";
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";

type Props = {
  filterKey: TInboxIssueFilterDateKeys;
  label?: string;
};

export const FilterDate = observer(function FilterDate(props: Props) {
  const { filterKey, label = "Created date" } = props;
  // hooks
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  // derived values
  const filterValue: string[] = inboxFilters?.[filterKey] || [];

  return (
    <DateFilterSubmenu
      label={label}
      options={PAST_DURATION_FILTER_OPTIONS}
      appliedFilters={filterValue}
      // intake keeps a single date value: picking a preset replaces whatever was applied
      onToggleOption={(value) => handleInboxIssueFilters(filterKey, filterValue.includes(value) ? [] : [value])}
      onSelectCustomRange={(value) => handleInboxIssueFilters(filterKey, value)}
      onClearCustomRange={() =>
        handleInboxIssueFilters(
          filterKey,
          filterValue.filter((value) => !isCustomDateFilterValue(value))
        )
      }
    />
  );
});

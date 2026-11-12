/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { TActivityFilters, TActivityFilterOption } from "@plane/constants";
import { ACTIVITY_FILTER_TYPE_OPTIONS } from "@plane/constants";
// components
import { ActivityFilter } from "@/components/issues/issue-detail/issue-activity";

export type TActivityFilterRoot = {
  selectedFilters: TActivityFilters[];
  toggleFilter: (filter: TActivityFilters) => void;
  projectId: string;
  isIntakeIssue?: boolean;
  /** Restricts the options to these filters (e.g. the ones the active activity tab covers). */
  filterKeys?: TActivityFilters[];
};

export function ActivityFilterRoot(props: TActivityFilterRoot) {
  const { selectedFilters, toggleFilter, filterKeys } = props;

  const filterEntries = Object.entries(ACTIVITY_FILTER_TYPE_OPTIONS).filter(
    ([key]) => !filterKeys || filterKeys.includes(key as TActivityFilters)
  );

  const filters: TActivityFilterOption[] = filterEntries.map(([key, value]) => {
    const filterKey = key as TActivityFilters;
    return {
      key: filterKey,
      labelTranslationKey: value.labelTranslationKey,
      isSelected: selectedFilters.includes(filterKey),
      onClick: () => toggleFilter(filterKey),
    };
  });

  return <ActivityFilter selectedFilters={selectedFilters} filterOptions={filters} />;
}

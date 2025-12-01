import type { FC } from "react";
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
};

export function ActivityFilterRoot(props: TActivityFilterRoot) {
  const { selectedFilters, toggleFilter } = props;

  const filters: TActivityFilterOption[] = Object.entries(ACTIVITY_FILTER_TYPE_OPTIONS).map(([key, value]) => {
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

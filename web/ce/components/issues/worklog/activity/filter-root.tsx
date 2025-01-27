"use client";

import { FC } from "react";
// components
import { TActivityFilters, ACTIVITY_FILTER_TYPE_OPTIONS, TActivityFilterOption } from "@plane/constants";
import { ActivityFilter } from "@/components/issues";
// plane web constants

export type TActivityFilterRoot = {
  selectedFilters: TActivityFilters[];
  toggleFilter: (filter: TActivityFilters) => void;
  projectId: string;
  isIntakeIssue?: boolean;
};

export const ActivityFilterRoot: FC<TActivityFilterRoot> = (props) => {
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
};

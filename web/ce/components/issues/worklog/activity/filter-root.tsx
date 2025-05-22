"use client";

import { FC } from "react";
import { useTranslation } from "@plane/i18n";
// components
import { ActivityFilter } from "@/components/issues";
// plane web constants
import { TActivityFilters, ACTIVITY_FILTER_TYPE_OPTIONS, TActivityFilterOption } from "@/plane-web/constants/issues";

export type TActivityFilterRoot = {
  selectedFilters: TActivityFilters[];
  toggleFilter: (filter: TActivityFilters) => void;
  projectId: string;
  isIntakeIssue?: boolean;
};

export const ActivityFilterRoot: FC<TActivityFilterRoot> = (props) => {
  const { selectedFilters, toggleFilter } = props;
  const { t } = useTranslation();

  const filters: TActivityFilterOption[] = Object.entries(ACTIVITY_FILTER_TYPE_OPTIONS).map(([key, value]) => {
    const filterKey = key as TActivityFilters;
    return {
      key: filterKey,
      label: t(value.label),
      isSelected: selectedFilters.includes(filterKey),
      onClick: () => toggleFilter(filterKey),
    };
  });

  return <ActivityFilter selectedFilters={selectedFilters} filterOptions={filters} />;
};

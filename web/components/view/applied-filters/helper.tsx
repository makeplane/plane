import { ReactNode } from "react";
import isEmpty from "lodash/isEmpty";
// types
import { TFilters } from "@plane/types";

type TComputedAppliedFilters = {
  key: string;
  title: string;
  selectedOptions?: { id: string; icon: ""; title: ""; component: ReactNode }[];
  dropdownOptions?: { id: string; icon: ""; title: ""; component: ReactNode }[];
}[];

export const filterOptions = (key: keyof TFilters, selectedFilters: string[]) => {
  switch (key) {
    case "project":
      return [];
    case "priority":
      return [];
    case "state":
      return [];
    case "state_group":
      return [];
    case "assignees":
      return [];
    case "mentions":
      return [];
    case "subscriber":
      return [];
    case "created_by":
      return [];
    case "labels":
      return [];
    case "start_date":
      return [];
    case "target_date":
      return [];
    default:
      return [];
  }
};

export const generateTitle = (title: string) =>
  title
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const constructAppliedFilters = (filters: TFilters): TComputedAppliedFilters => {
  const appliedFilters: TComputedAppliedFilters = [];

  if (filters && !isEmpty(filters)) {
    Object.keys(filters).forEach((_filterKey) => {
      const _key = _filterKey as keyof TFilters;
      const _value = filters[_key];

      if (_value && !isEmpty(_value)) {
        appliedFilters.push({
          key: _key,
          title: generateTitle(_key),
        });
      }
    });
  }

  return appliedFilters;
};

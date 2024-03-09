import sortBy from "lodash/sortBy";
// helpers
import { satisfiesDateFilter } from "helpers/filter.helper";
// types
import { ICycle, TCycleFilters } from "@plane/types";

/**
 * @description orders cycles based on their status
 * @param {ICycle[]} cycles
 * @returns {ICycle[]}
 */
export const orderCycles = (cycles: ICycle[]): ICycle[] => {
  if (cycles.length === 0) return [];

  const STATUS_ORDER: {
    [key: string]: number;
  } = {
    current: 1,
    upcoming: 2,
    draft: 3,
  };

  let filteredCycles = cycles.filter((c) => c.status.toLowerCase() !== "completed");
  filteredCycles = sortBy(filteredCycles, [
    (c) => STATUS_ORDER[c.status.toLowerCase()],
    (c) => (c.status.toLowerCase() === "upcoming" ? c.start_date : c.name.toLowerCase()),
  ]);

  return filteredCycles;
};

/**
 * @description filters cycles based on the filter
 * @param {ICycle} cycle
 * @param {TCycleFilters} filter
 * @returns {boolean}
 */
export const shouldFilterCycle = (cycle: ICycle, filter: TCycleFilters): boolean => {
  let fallsInFilters = true;
  Object.keys(filter).forEach((key) => {
    const filterKey = key as keyof TCycleFilters;
    if (filterKey === "status" && filter.status && filter.status.length > 0)
      fallsInFilters = fallsInFilters && filter.status.includes(cycle.status.toLowerCase());
    if (filterKey === "start_date" && filter.start_date && filter.start_date.length > 0) {
      filter.start_date.forEach((dateFilter) => {
        fallsInFilters =
          fallsInFilters && !!cycle.start_date && satisfiesDateFilter(new Date(cycle.start_date), dateFilter);
      });
    }
    if (filterKey === "end_date" && filter.end_date && filter.end_date.length > 0) {
      filter.end_date.forEach((dateFilter) => {
        fallsInFilters =
          fallsInFilters && !!cycle.end_date && satisfiesDateFilter(new Date(cycle.end_date), dateFilter);
      });
    }
  });

  return fallsInFilters;
};

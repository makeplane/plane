import sortBy from "lodash/sortBy";
import { ICycle, TCycleFilters } from "@plane/types";
// helpers
import { getDate } from "@/helpers/date-time.helper";
import { satisfiesDateFilter } from "@/helpers/filter.helper";

/**
 * @description orders cycles based on their status
 * @param {ICycle[]} cycles
 * @returns {ICycle[]}
 */
export const orderCycles = (cycles: ICycle[], sortByManual: boolean): ICycle[] => {
  if (cycles.length === 0) return [];

  const acceptedStatuses = ["current", "upcoming", "draft"];
  const STATUS_ORDER: {
    [key: string]: number;
  } = {
    current: 1,
    upcoming: 2,
    draft: 3,
  };

  let filteredCycles = cycles.filter((c) => acceptedStatuses.includes(c.status?.toLowerCase() ?? ""));
  if (sortByManual) filteredCycles = sortBy(filteredCycles, [(c) => c.sort_order]);
  else
    filteredCycles = sortBy(filteredCycles, [
      (c) => STATUS_ORDER[c.status?.toLowerCase() ?? ""],
      (c) => (c.status?.toLowerCase() === "upcoming" ? c.start_date : c.name.toLowerCase()),
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
      fallsInFilters = fallsInFilters && filter.status.includes(cycle.status?.toLowerCase() ?? "");
    if (filterKey === "start_date" && filter.start_date && filter.start_date.length > 0) {
      const startDate = getDate(cycle.start_date);
      filter.start_date.forEach((dateFilter) => {
        fallsInFilters = fallsInFilters && !!startDate && satisfiesDateFilter(startDate, dateFilter);
      });
    }
    if (filterKey === "end_date" && filter.end_date && filter.end_date.length > 0) {
      const endDate = getDate(cycle.end_date);
      filter.end_date.forEach((dateFilter) => {
        fallsInFilters = fallsInFilters && !!endDate && satisfiesDateFilter(endDate, dateFilter);
      });
    }
  });

  return fallsInFilters;
};

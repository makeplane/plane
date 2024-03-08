import sortBy from "lodash/sortBy";
// helpers
import { satisfiesDateFilter } from "helpers/filter.helper";
// types
import { ICycle, TCycleFilters, TCycleOrderByOptions } from "@plane/types";

/**
 * @description orders cycles based on the orderByKey
 * @param {ICycle[]} cycles
 * @param {TCycleOrderByOptions | undefined} orderByKey
 * @returns {ICycle[]}
 */
export const orderCycles = (cycles: ICycle[], orderByKey: TCycleOrderByOptions | undefined): ICycle[] => {
  let orderedCycles: ICycle[] = [];
  if (cycles.length === 0) return orderedCycles;

  if (orderByKey === "name") orderedCycles = sortBy(cycles, [(c) => c.name.toLowerCase()]);
  if (orderByKey === "-name") orderedCycles = sortBy(cycles, [(c) => c.name.toLowerCase()]).reverse();
  if (orderByKey === "end_date") orderedCycles = sortBy(cycles, [(c) => c.end_date]);
  if (orderByKey === "-end_date") orderedCycles = sortBy(cycles, [(c) => !c.end_date]);
  if (orderByKey === "sort_order") orderedCycles = sortBy(cycles, [(c) => c.sort_order]);
  if (orderByKey === "-sort_order") orderedCycles = sortBy(cycles, [(c) => !c.start_date]);

  return orderedCycles;
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

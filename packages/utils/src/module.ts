import sortBy from "lodash/sortBy";
// plane imports
import { IModule, TModuleDisplayFilters, TModuleFilters, TModuleOrderByOptions } from "@plane/types";
// local imports
import { getDate  } from "./datetime";
import { satisfiesDateFilter  } from "./filter";

/**
 * @description orders modules based on their status
 * @param {IModule[]} modules
 * @param {TModuleOrderByOptions | undefined} orderByKey
 * @returns {IModule[]}
 */
export const orderModules = (modules: IModule[], orderByKey: TModuleOrderByOptions | undefined): IModule[] => {
  let orderedModules: IModule[] = [];
  if (modules.length === 0 || !orderByKey) return [];

  if (orderByKey === "name") orderedModules = sortBy(modules, [(m) => m.name.toLowerCase()]);
  if (orderByKey === "-name") orderedModules = sortBy(modules, [(m) => m.name.toLowerCase()]).reverse();
  if (["progress", "-progress"].includes(orderByKey))
    orderedModules = sortBy(modules, [
      (m) => {
        let progress = (m.completed_issues + m.cancelled_issues) / m.total_issues;
        if (isNaN(progress)) progress = 0;
        return orderByKey === "progress" ? progress : -progress;
      },
      "name",
    ]);
  if (["issues_length", "-issues_length"].includes(orderByKey))
    orderedModules = sortBy(modules, [
      (m) => (orderByKey === "issues_length" ? m.total_issues : !m.total_issues),
      "name",
    ]);
  if (orderByKey === "target_date") orderedModules = sortBy(modules, [(m) => m.target_date]);
  if (orderByKey === "-target_date") orderedModules = sortBy(modules, [(m) => !m.target_date]);
  if (orderByKey === "created_at") orderedModules = sortBy(modules, [(m) => m.created_at]);
  if (orderByKey === "-created_at") orderedModules = sortBy(modules, [(m) => !m.created_at]);

  if (orderByKey === "sort_order") orderedModules = sortBy(modules, [(m) => m.sort_order]);
  return orderedModules;
};

/**
 * @description filters modules based on the filters
 * @param {IModule} module
 * @param {TModuleDisplayFilters} displayFilters
 * @param {TModuleFilters} filters
 * @returns {boolean}
 */
export const shouldFilterModule = (
  module: IModule,
  displayFilters: TModuleDisplayFilters,
  filters: TModuleFilters
): boolean => {
  let fallsInFilters = true;
  Object.keys(filters).forEach((key) => {
    const filterKey = key as keyof TModuleFilters;
    if (filterKey === "status" && filters.status && filters.status.length > 0)
      fallsInFilters = fallsInFilters && filters.status.includes(module.status?.toLowerCase() ?? "");
    if (filterKey === "lead" && filters.lead && filters.lead.length > 0)
      fallsInFilters = fallsInFilters && filters.lead.includes(`${module.lead_id}`);
    if (filterKey === "members" && filters.members && filters.members.length > 0) {
      const memberIds = module.member_ids;
      fallsInFilters = fallsInFilters && filters.members.some((memberId) => memberIds.includes(memberId));
    }
    if (filterKey === "start_date" && filters.start_date && filters.start_date.length > 0) {
      const startDate = getDate(module.start_date);
      filters.start_date.forEach((dateFilter) => {
        fallsInFilters = fallsInFilters && !!startDate && satisfiesDateFilter(startDate, dateFilter);
      });
    }
    if (filterKey === "target_date" && filters.target_date && filters.target_date.length > 0) {
      const endDate = getDate(module.target_date);
      filters.target_date.forEach((dateFilter) => {
        fallsInFilters = fallsInFilters && !!endDate && satisfiesDateFilter(endDate, dateFilter);
      });
    }
  });
  if (displayFilters.favorites && !module.is_favorite) fallsInFilters = false;

  return fallsInFilters;
};

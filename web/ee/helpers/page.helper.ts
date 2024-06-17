// TODO: remove this component once TPage and TWorkspacePage are the same based on the response from the backend

import sortBy from "lodash/sortBy";
import { TPageFilterProps, TPageFiltersSortBy, TPageFiltersSortKey, TPageNavigationTabs } from "@plane/types";
// helpers
import { getDate } from "@/helpers/date-time.helper";
import { satisfiesDateFilter } from "@/helpers/filter.helper";
// plane web types
import { TWorkspacePage } from "@/plane-web/types";

/**
 * @description filters pages based on the page type
 * @param {TPageNavigationTabs} pageType
 * @param {TWorkspacePage[]} pages
 * @returns {TWorkspacePage[]}
 */
export const filterPagesByPageType = (pageType: TPageNavigationTabs, pages: TWorkspacePage[]): TWorkspacePage[] =>
  pages.filter((page) => {
    if (pageType === "public") return page.access === 0 && !page.archived_at;
    if (pageType === "private") return page.access === 1 && !page.archived_at;
    if (pageType === "archived") return page.archived_at;
    return true;
  });

/**
 * @description orders pages based on their status
 * @param {TWorkspacePage[]} pages
 * @param {TPageFiltersSortKey | undefined} sortByKey
 * @param {TPageFiltersSortBy} sortByOrder
 * @returns {TWorkspacePage[]}
 */
export const orderPages = (
  pages: TWorkspacePage[],
  sortByKey: TPageFiltersSortKey | undefined,
  sortByOrder: TPageFiltersSortBy
): TWorkspacePage[] => {
  let orderedPages: TWorkspacePage[] = [];
  if (pages.length === 0 || !sortByKey) return [];

  if (sortByKey === "name") {
    orderedPages = sortBy(pages, [(m) => m.name?.toLowerCase()]);
    if (sortByOrder === "desc") orderedPages = orderedPages.reverse();
  }
  if (sortByKey === "created_at") {
    orderedPages = sortBy(pages, [(m) => m.created_at]);
    if (sortByOrder === "desc") orderedPages = orderedPages.reverse();
  }
  if (sortByKey === "updated_at") {
    orderedPages = sortBy(pages, [(m) => m.updated_at]);
    if (sortByOrder === "desc") orderedPages = orderedPages.reverse();
  }

  return orderedPages;
};

/**
 * @description filters pages based on the filters
 * @param {TWorkspacePage} page
 * @param {TPageFilterProps | undefined} filters
 * @returns {boolean}
 */
export const shouldFilterPage = (page: TWorkspacePage, filters: TPageFilterProps | undefined): boolean => {
  let fallsInFilters = true;
  Object.keys(filters ?? {}).forEach((key) => {
    const filterKey = key as keyof TPageFilterProps;
    if (filterKey === "created_by" && filters?.created_by && filters.created_by.length > 0)
      fallsInFilters = fallsInFilters && filters.created_by.includes(`${page.created_by}`);
    if (filterKey === "created_at" && filters?.created_at && filters.created_at.length > 0) {
      const createdDate = getDate(page.created_at);
      filters?.created_at.forEach((dateFilter) => {
        fallsInFilters = fallsInFilters && !!createdDate && satisfiesDateFilter(createdDate, dateFilter);
      });
    }
  });
  if (filters?.favorites && !page.is_favorite) fallsInFilters = false;

  return fallsInFilters;
};

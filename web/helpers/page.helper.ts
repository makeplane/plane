import sortBy from "lodash/sortBy";
import { TPage, TPageFilterProps, TPageFiltersSortBy, TPageFiltersSortKey, TPageNavigationTabs } from "@plane/types";
// helpers
import { getDate } from "@/helpers/date-time.helper";
import { satisfiesDateFilter } from "@/helpers/filter.helper";

/**
 * @description filters pages based on the page type
 * @param {TPageNavigationTabs} pageType
 * @param {TPage[]} pages
 * @returns {TPage[]}
 */
export const filterPagesByPageType = (pageType: TPageNavigationTabs, pages: TPage[]): TPage[] =>
  pages.filter((page) => {
    if (pageType === "public") return page.access === 0 && !page.archived_at;
    if (pageType === "private") return page.access === 1 && !page.archived_at;
    if (pageType === "archived") return page.archived_at;
    return true;
  });

/**
 * @description orders pages based on their status
 * @param {TPage[]} pages
 * @param {TPageFiltersSortKey | undefined} sortByKey
 * @param {TPageFiltersSortBy} sortByOrder
 * @returns {TPage[]}
 */
export const orderPages = (
  pages: TPage[],
  sortByKey: TPageFiltersSortKey | undefined,
  sortByOrder: TPageFiltersSortBy
): TPage[] => {
  let orderedPages: TPage[] = [];
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
 * @param {TPage} page
 * @param {TPageFilterProps | undefined} filters
 * @returns {boolean}
 */
export const shouldFilterPage = (page: TPage, filters: TPageFilterProps | undefined): boolean => {
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

/**
 * @description returns the name of the project after checking for untitled page
 * @param {string | undefined} name
 * @returns {string}
 */
export const getPageName = (name: string | undefined) => {
  if (name === undefined) return "";
  if (!name || name.trim() === "") return "Untitled";
  return name;
};

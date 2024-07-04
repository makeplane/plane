import isNil from "lodash/isNil";
import orderBy from "lodash/orderBy";
import { IProjectView, TViewFilterProps, TViewFiltersSortBy, TViewFiltersSortKey } from "@plane/types";
import { getDate } from "@/helpers/date-time.helper";
import { satisfiesDateFilter } from "./filter.helper";

/**
 * order views base on TViewFiltersSortKey
 * @param views
 * @param sortByKey
 * @param sortByOrder
 * @returns
 */
export const orderViews = (
  views: IProjectView[],
  sortByKey: TViewFiltersSortKey | undefined,
  sortByOrder: TViewFiltersSortBy
): IProjectView[] => {
  if (views.length === 0 || !sortByKey) return [];

  let iterableFunction;
  if (sortByKey === "name") {
    iterableFunction = (view: IProjectView) => view.name?.toLowerCase();
  }
  if (sortByKey === "created_at") {
    iterableFunction = (view: IProjectView) => view.created_at;
  }
  if (sortByKey === "updated_at") {
    iterableFunction = (view: IProjectView) => view.updated_at;
  }

  if (!iterableFunction) return [];

  return orderBy(views, [iterableFunction], [sortByOrder]);
};

/**
 * Checks if the passed down view should be filtered or not
 * @param view
 * @param filters
 * @returns
 */
export const shouldFilterView = (view: IProjectView, filters: TViewFilterProps | undefined): boolean => {
  let fallsInFilters = true;
  Object.keys(filters ?? {}).forEach((key) => {
    const filterKey = key as keyof TViewFilterProps;
    if (filterKey === "owned_by" && filters?.owned_by && filters.owned_by.length > 0) {
      fallsInFilters = fallsInFilters && filters.owned_by.includes(`${view.created_by}`);
    }

    if (filterKey === "created_at" && filters?.created_at && filters.created_at.length > 0) {
      const createdDate = getDate(view.created_at);
      filters?.created_at.forEach((dateFilter) => {
        fallsInFilters = fallsInFilters && !!createdDate && satisfiesDateFilter(createdDate, dateFilter);
      });
    }

    if (filterKey === "view_type" && filters?.view_type && filters?.view_type?.length > 0) {
      fallsInFilters = filters.view_type.includes(view.access);
    }
  });

  if (filters?.favorites && !view.is_favorite) fallsInFilters = false;

  return fallsInFilters;
};

/**
 * @description returns the name of the project after checking for untitled view
 * @param {string | undefined} name
 * @returns {string}
 */
export const getViewName = (name: string | undefined) => {
  if (name === undefined) return "";
  if (!name || name.trim() === "") return "Untitled";
  return name;
};

/**
 * Adds validation for the view creation filters
 * @param data
 * @returns
 */
export const getValidatedViewFilters = (data: Partial<IProjectView>) => {
  if (data?.display_filters && data?.display_filters?.layout === "kanban" && isNil(data.display_filters.group_by)) {
    data.display_filters.group_by = "state";
  }

  return data;
};

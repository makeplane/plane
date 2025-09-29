import { orderBy, isNil } from "lodash-es";
// plane constants
import { SPACE_BASE_PATH, SPACE_BASE_URL } from "@plane/constants";
// plane types
import { TTeamspaceView, TViewFilterProps, TViewFiltersSortBy, TViewFiltersSortKey } from "@plane/types";
// helpers
import { getDate, satisfiesDateFilter } from "@plane/utils";

/**
 * order views base on TViewFiltersSortKey
 * @param views
 * @param sortByKey
 * @param sortByOrder
 * @returns
 */
export const orderViews = (
  views: TTeamspaceView[],
  sortByKey: TViewFiltersSortKey | undefined,
  sortByOrder: TViewFiltersSortBy
): TTeamspaceView[] => {
  if (views.length === 0 || !sortByKey) return [];

  let iterableFunction;
  if (sortByKey === "name") {
    iterableFunction = (view: TTeamspaceView) => view.name?.toLowerCase();
  }
  if (sortByKey === "created_at") {
    iterableFunction = (view: TTeamspaceView) => view.created_at;
  }
  if (sortByKey === "updated_at") {
    iterableFunction = (view: TTeamspaceView) => view.updated_at;
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
export const shouldFilterView = (view: TTeamspaceView, filters: TViewFilterProps | undefined): boolean => {
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
export const getViewName = (name: string | undefined): string => {
  if (name === undefined) return "";
  if (!name || name.trim() === "") return "Untitled";
  return name;
};

/**
 * Adds validation for the view creation filters
 * @param data
 * @returns
 */
export const getValidatedViewFilters = (data: Partial<TTeamspaceView>) => {
  if (data?.display_filters && data?.display_filters?.layout === "kanban" && isNil(data.display_filters.group_by)) {
    data.display_filters.group_by = "state";
  }

  return data;
};

/**
 * returns published view link
 * @param anchor
 * @returns
 */
export const getPublishViewLink = (anchor: string | undefined) => {
  if (!anchor) return;

  const SPACE_APP_URL = (SPACE_BASE_URL.trim() === "" ? window.location.origin : SPACE_BASE_URL) + SPACE_BASE_PATH;
  return `${SPACE_APP_URL}/views/${anchor}`;
};

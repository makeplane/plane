import { TIssueBoardKeys } from "types/issue";
import { IIssueFilterOptions, TIssueParams } from "./types";

export const isNil = (value: any) => {
  if (value === undefined || value === null) return true;

  return false;
};

export interface ILayoutDisplayFiltersOptions {
  filters: (keyof IIssueFilterOptions)[];
  display_properties: boolean | null;
  display_filters: null;
  extra_options: null;
}

export const ISSUE_DISPLAY_FILTERS_BY_LAYOUT: {
  [pageType: string]: { [layoutType: string]: ILayoutDisplayFiltersOptions };
} = {
  issues: {
    list: {
      filters: ["priority", "state", "labels"],
      display_properties: null,
      display_filters: null,
      extra_options: null,
    },
    kanban: {
      filters: ["priority", "state", "labels"],
      display_properties: null,
      display_filters: null,
      extra_options: null,
    },
  },
};

export const handleIssueQueryParamsByLayout = (
  layout: TIssueBoardKeys | undefined,
  viewType: "issues"
): TIssueParams[] | null => {
  const queryParams: TIssueParams[] = [];

  if (!layout) return null;

  const layoutOptions = ISSUE_DISPLAY_FILTERS_BY_LAYOUT[viewType][layout];

  // add filters query params
  layoutOptions.filters.forEach((option) => {
    queryParams.push(option);
  });

  return queryParams;
};

import { ILayoutDisplayFiltersOptions } from "@/types/issue-filters";

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

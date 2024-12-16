import { TIssueActivityComment } from "@plane/types";
// constants
import { ILayoutDisplayFiltersOptions } from "@/constants/issue";

export enum EActivityFilterType {
  ACTIVITY = "ACTIVITY",
  COMMENT = "COMMENT",
}

export type TActivityFilters = EActivityFilterType;

export const ACTIVITY_FILTER_TYPE_OPTIONS: Record<EActivityFilterType, { label: string }> = {
  [EActivityFilterType.ACTIVITY]: {
    label: "Updates",
  },
  [EActivityFilterType.COMMENT]: {
    label: "Comments",
  },
};

export const defaultActivityFilters: TActivityFilters[] = [EActivityFilterType.ACTIVITY, EActivityFilterType.COMMENT];

export type TActivityFilterOption = {
  key: TActivityFilters;
  label: string;
  isSelected: boolean;
  onClick: () => void;
};

export const filterActivityOnSelectedFilters = (
  activity: TIssueActivityComment[],
  filter: TActivityFilters[]
): TIssueActivityComment[] =>
  activity.filter((activity) => filter.includes(activity.activity_type as TActivityFilters));

export const ENABLE_ISSUE_DEPENDENCIES = false;

export const ADDITIONAL_ISSUE_DISPLAY_FILTERS_BY_LAYOUT: {
  [pageType: string]: { [layoutType: string]: ILayoutDisplayFiltersOptions };
} = {};

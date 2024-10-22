// types
import { TIssueActivityComment } from "@plane/types";
// ce constants
import {
  TActivityFilters as TActivityFiltersCe,
  EActivityFilterType,
  ACTIVITY_FILTER_TYPE_OPTIONS as ACTIVITY_FILTER_TYPE_OPTIONS_CE,
} from "@/ce/constants/issues";

export enum EActivityFilterTypeEE {
  WORKLOG = "WORKLOG",
  ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY = "ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY",
}

export type TActivityFilters = TActivityFiltersCe | EActivityFilterTypeEE.WORKLOG;

export const ACTIVITY_FILTER_TYPE_OPTIONS: Record<TActivityFilters, { label: string }> = {
  ...ACTIVITY_FILTER_TYPE_OPTIONS_CE,
  [EActivityFilterTypeEE.WORKLOG]: {
    label: "Worklogs",
  },
};

export const defaultActivityFilters: TActivityFilters[] = [
  EActivityFilterType.ACTIVITY,
  EActivityFilterType.COMMENT,
  EActivityFilterTypeEE.WORKLOG,
];

export type TActivityFilterOption = {
  key: TActivityFilters;
  label: string;
  isSelected: boolean;
  onClick: () => void;
};

const shouldRenderActivity = (activity: TIssueActivityComment, filter: TActivityFilters): boolean =>
  activity.activity_type === filter ||
  (filter === EActivityFilterType.ACTIVITY &&
    activity.activity_type === EActivityFilterTypeEE.ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY);

export const filterActivityOnSelectedFilters = (
  activity: TIssueActivityComment[],
  filters: TActivityFilters[]
): TIssueActivityComment[] =>
  activity.filter((activity) => filters.some((filter) => shouldRenderActivity(activity, filter)));

export { EActivityFilterType };

export const ENABLE_LOCAL_DB_CACHE = false;

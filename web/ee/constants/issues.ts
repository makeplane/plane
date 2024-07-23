// types
import { TIssueActivityComment } from "@plane/types";
// ce constants
import {
  TActivityFilters as TActivityFiltersCe,
  EActivityFilterType,
  ACTIVITY_FILTER_TYPE_OPTIONS as ACTIVITY_FILTER_TYPE_OPTIONS_CE,
} from "ce/constants/issues";

export enum EActivityFilterTypeEE {
  WORKLOG = "WORKLOG",
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

export const filterActivityOnSelectedFilters = (
  activity: TIssueActivityComment[],
  filter: TActivityFilters[]
): TIssueActivityComment[] =>
  activity.filter((activity) => filter.includes(activity.activity_type as TActivityFilters));

export { EActivityFilterType };

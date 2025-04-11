import { ReactNode } from "react";
// plane imports
import {
  EIssueCommentAccessSpecifier,
  ETeamspaceAnalyticsDataKeys,
  ETeamspaceAnalyticsValueKeys,
  EStatisticsLegend,
  EProgressXAxisKeys,
  EProgressDataKeys,
  ERelationType,
  ETeamspaceEntityScope,
} from "@plane/constants";
import {
  IUserLite,
  TChartData,
  TStateGroups,
  TTeamspaceActivity,
  TTeamspaceActivityKeys,
  TTeamspaceReaction,
} from "@plane/types";

export type TTeamspaceActivityDetails = {
  icon: ReactNode;
  message: ReactNode;
  customUserName?: string;
};

export type TTeamspaceActivityDetailsHelperMap = {
  [key in TTeamspaceActivityKeys]: (activity: TTeamspaceActivity) => TTeamspaceActivityDetails;
};

export type TWorkloadFilter = {
  yAxisKey: ETeamspaceAnalyticsValueKeys;
  xAxisKey: EProgressXAxisKeys;
};

export type TTeamspaceProgressChart = {
  distribution: TChartData<EProgressXAxisKeys, EProgressDataKeys>[];
};

export type TStatisticsFilter = {
  scope: ETeamspaceEntityScope;
  data_key: ETeamspaceAnalyticsDataKeys;
  value_key: ETeamspaceAnalyticsValueKeys;
  issue_type: string[]; // issue type ids
  state_group: TStateGroups[]; // state group names
  dependency_type: ERelationType | undefined;
  target_date: string[];
  legend: EStatisticsLegend;
};

export type TStatisticsFilterProps<K extends keyof TStatisticsFilter> = {
  value: TStatisticsFilter[K];
  isLoading: boolean;
  buttonContainerClassName?: string;
  chevronClassName?: string;
  handleFilterChange: (value: TStatisticsFilter[K]) => Promise<void>;
};

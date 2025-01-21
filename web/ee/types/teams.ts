import { ReactNode } from "react";
// plane imports
import {
  EIssueCommentAccessSpecifier,
  ETeamAnalyticsDataKeys,
  ETeamAnalyticsValueKeys,
  EStatisticsLegend,
  EProgressXAxisKeys,
  EProgressDataKeys,
  ERelationType,
  ETeamEntityScope,
} from "@plane/constants";
import {
  IUserLite,
  TStackChartData,
  TStateGroups,
  TTeamActivity,
  TTeamActivityKeys,
  TTeamReaction,
} from "@plane/types";

export type TTeamActivityDetails = {
  icon: ReactNode;
  message: ReactNode;
  customUserName?: string;
};

export type TTeamActivityDetailsHelperMap = {
  [key in TTeamActivityKeys]: (activity: TTeamActivity) => TTeamActivityDetails;
};

export type TTeamComment = {
  id: string;
  actor: string;
  actor_detail: IUserLite;
  comment_reactions: TTeamReaction[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  comment_stripped: string | null;
  comment_json: object;
  comment_html: string | null;
  attachments: object[];
  access: EIssueCommentAccessSpecifier;
  external_id: string | undefined;
  external_source: string | undefined;
  created_by: string;
  updated_by: string | null;
  workspace: string;
  team: string;
};

export type TWorkloadFilter = {
  yAxisKey: ETeamAnalyticsValueKeys;
  xAxisKey: EProgressXAxisKeys;
};

export type TTeamProgressChart = {
  distribution: TStackChartData<EProgressXAxisKeys, EProgressDataKeys>[];
};

export type TStatisticsFilter = {
  scope: ETeamEntityScope;
  data_key: ETeamAnalyticsDataKeys;
  value_key: ETeamAnalyticsValueKeys;
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

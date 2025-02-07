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
  TStackChartData,
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

export type TTeamspaceComment = {
  id: string;
  actor: string;
  actor_detail: IUserLite;
  comment_reactions: TTeamspaceReaction[];
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
  yAxisKey: ETeamspaceAnalyticsValueKeys;
  xAxisKey: EProgressXAxisKeys;
};

export type TTeamspaceProgressChart = {
  distribution: TStackChartData<EProgressXAxisKeys, EProgressDataKeys>[];
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

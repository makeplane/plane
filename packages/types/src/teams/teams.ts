import { TIssue, TLogoProps, TStackChartData, TStateGroups } from "@plane/types";

export type TTeam = {
  id: string;
  name: string;
  description_json: object | undefined;
  description_html: string | undefined;
  description_stripped: string | undefined;
  description_binary: string | undefined;
  logo_props: TLogoProps;
  lead_id: string | undefined;
  member_ids: string[] | undefined;
  project_ids: string[] | undefined;
  workspace: string;
  // timestamps
  created_at: string;
  updated_at: string;
  // user
  created_by: string;
  updated_by: string;
};

export type TTeamMember = {
  id: string;
  team_space: string;
  member: string;
  workspace: string;
  sort_order: number;
  // timestamps
  created_at: string;
  updated_at: string;
  // user
  created_by: string;
  updated_by: string;
};

export type TTeamEntities = {
  linked_entities: {
    projects: number;
    issues: number;
    cycles: number;
    pages: number;
    views: number;
    total: number;
  };
  team_entities: {
    pages: number;
    views: number;
    total: number;
  };
};

export type TTeamScope = "teams" | "projects";

export type TCreateUpdateTeamModal = {
  isOpen: boolean;
  teamId: string | undefined;
};

export type TTeamAnalyticsDataKeys = "projects" | "members";

// export type TTeamAnalyticsValueKeys = "issues" | "points";
export type TTeamAnalyticsValueKeys = "issues";

// --------------- Team Workload ---------------

export type TWorkloadXAxisKeys = "target_date" | "start_date" | "priority";

export type TWorkloadDataKeys = "completed" | "pending" | "overdue";

export type TWorkloadFilter = {
  yAxisKey: TTeamAnalyticsValueKeys;
  xAxisKey: TWorkloadXAxisKeys;
};

export type TTeamWorkloadChart = {
  distribution: TStackChartData<TWorkloadXAxisKeys, TWorkloadDataKeys>[];
};

export type TTeamWorkloadSummary = {
  backlog_issues: number;
  cancelled_issues: number;
  completed_issues: number;
  pending_issues: number;
  overdue_issues: number;
  no_due_date_issues: number;
};

// --------------- Team Dependencies ---------------

export type TDependencyType = "blocking" | "blocked_by";

export type TTeamDependencyIssue = Pick<
  TIssue,
  "id" | "name" | "type_id" | "sequence_id" | "project_id" | "priority" | "assignee_ids" | "archived_at"
> & {
  state__group: TStateGroups;
};

export type TTeamDependencies = {
  blocking_issues: TTeamDependencyIssue[];
  blocked_by_issues: TTeamDependencyIssue[];
};

// --------------- Team Statistics ---------------

export type TStatisticsLegend = "state" | "priority";

export type TStatisticsFilter = {
  data_key: TTeamAnalyticsDataKeys;
  value_key: TTeamAnalyticsValueKeys;
  issue_type: string[]; // issue type ids
  state_group: TStateGroups[]; // state group names
  dependency_type: TDependencyType | undefined;
  target_date: string[];
  legend: TStatisticsLegend;
};

export type TTeamStatistics = {
  identifier: string;
  count: number;
}[];

export type TStatisticsFilterProps<K extends keyof TStatisticsFilter> = {
  value: TStatisticsFilter[K];
  isLoading: boolean;
  buttonContainerClassName?: string;
  chevronClassName?: string;
  handleFilterChange: (value: TStatisticsFilter[K]) => Promise<void>;
};

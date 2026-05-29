import type { ICycle } from "./cycle";
import type { TIssue } from "./issues/issue";
import type { IModule } from "./module";
import type { IProjectLite } from "./project";
import type { TStateGroups } from "./state";
import type { IUserLite } from "./users";
import type {
  IIssueDisplayProperties,
  TIssueExtraOptions,
  TIssueGroupByOptions,
  TIssueGroupingFilters,
  TIssueOrderByOptions,
} from "./view-props";
import type { IWorkspaceLite } from "./workspace";

export interface IIssueCycle {
  id: string;
  cycle_detail: ICycle;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
  issue: string;
  cycle: string;
}

export interface IIssueModule {
  created_at: Date;
  created_by: string;
  id: string;
  issue: string;
  module: string;
  module_detail: IModule;
  project: string;
  updated_at: Date;
  updated_by: string;
  workspace: string;
}

export interface ILinkDetails {
  created_at: Date;
  created_by: string;
  id: string;
  metadata: any;
  title: string;
  url: string;
}

export interface ISubIssueResponse {
  state_distribution: Record<TStateGroups, number>;
  sub_issues: TIssue[];
}

export interface IIssueLabel {
  id: string;
  name: string;
  color: string;
  project_id: string;
  workspace_id: string;
  parent: string | null;
  sort_order: number;
}

export interface IIssueLabelTree extends IIssueLabel {
  children: IIssueLabel[] | undefined;
}

export interface IIssueActivity {
  access?: "EXTERNAL" | "INTERNAL";
  actor: string;
  actor_detail: IUserLite;
  attachments: any[];
  comment?: string;
  comment_html?: string;
  comment_stripped?: string;
  created_at: Date;
  created_by: string;
  field: string | null;
  id: string;
  issue: string | null;
  issue_comment?: string | null;
  issue_detail: {
    description_html: string;
    id: string;
    name: string;
    priority: string | null;
    sequence_id: string;
    type_id: string;
  } | null;
  new_identifier: string | null;
  new_value: string | null;
  old_identifier: string | null;
  old_value: string | null;
  project: string;
  project_detail: IProjectLite;
  updated_at: Date;
  updated_by: string;
  verb: string;
  workspace: string;
  workspace_detail?: IWorkspaceLite;
}

export type TIssuePriorities = "urgent" | "high" | "medium" | "low" | "none";

export interface ViewFlags {
  enableQuickAdd: boolean;
  enableIssueCreation: boolean;
  enableInlineEditing: boolean;
}

export type GroupByColumnTypes =
  | "project"
  | "cycle"
  | "module"
  | "state"
  | "state_detail.group"
  | "priority"
  | "labels"
  | "assignees"
  | "created_by"
  | "team_project";

export type TGetColumns = {
  isWorkspaceLevel?: boolean;
  projectId?: string;
};

export interface IGroupByColumn {
  id: string;
  name: string;
  icon?: React.ReactElement | undefined;
  payload: Partial<TIssue>;
  isDropDisabled?: boolean;
  dropErrorMessage?: string;
}

export interface IIssueMap {
  [key: string]: TIssue;
}

export interface ILayoutDisplayFiltersOptions {
  display_properties: (keyof IIssueDisplayProperties)[];
  display_filters: {
    group_by?: TIssueGroupByOptions[];
    sub_group_by?: TIssueGroupByOptions[];
    order_by?: TIssueOrderByOptions[];
    type?: TIssueGroupingFilters[];
  };
  extra_options: {
    access: boolean;
    values: TIssueExtraOptions[];
  };
}

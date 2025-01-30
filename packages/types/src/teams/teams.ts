import { TIssue, TLogoProps, TStateGroups, TWorkspaceBaseActivity, TBaseActivityVerbs, IUserLite } from "@plane/types";

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

export type TCreateUpdateTeamModal = {
  isOpen: boolean;
  teamId: string | undefined;
};

// --------------- Team Activity & Comments ---------------

export type TTeamActivityFields =
  | "team_space"
  | "name"
  | "description"
  | "lead"
  | "projects"
  | "members"
  | "view"
  | "page";

export type TTeamActivityVerbs = TBaseActivityVerbs;

export type TTeamActivity = TWorkspaceBaseActivity<TTeamActivityFields, TTeamActivityVerbs>;

export type TTeamActivityKeys = `${TTeamActivityFields}_${TTeamActivityVerbs}`;

export type TTeamReaction = {
  id: string;
  reaction: string;
  actor: string;
  actor_detail: IUserLite;
};

// --------------- Team Workload ---------------

export type TTeamProgressSummary = {
  backlog_issues: number;
  cancelled_issues: number;
  completed_issues: number;
  pending_issues: number;
  overdue_issues: number;
  no_due_date_issues: number;
};

// --------------- Team Dependencies ---------------

type TIssueLite = Pick<
  TIssue,
  "id" | "name" | "type_id" | "sequence_id" | "project_id" | "priority" | "archived_at"
> & { state__group: TStateGroups };

export type TTeamDependencyIssue = TIssueLite & {
  related_issues: TIssueLite[];
  related_assignee_ids: string[];
};

export type TTeamRelations = {
  blocking_issues: TTeamDependencyIssue[];
  blocked_by_issues: TTeamDependencyIssue[];
};

// --------------- Team Statistics ---------------

export type TTeamStatistics = {
  identifier: string;
  count: number;
}[];

import { TIssuePriorities } from "../issues";
import { TIssuePublicComment } from "./activity/issue_comment";
import { TIssueAttachment } from "./issue_attachment";
import { TIssueLink } from "./issue_link";
import { TIssueReaction, IIssuePublicReaction, IPublicVote } from "./issue_reaction";
import { TIssueRelationTypes } from "./issue_relation";

export enum EIssueLayoutTypes {
  LIST = "list",
  KANBAN = "kanban",
  CALENDAR = "calendar",
  GANTT = "gantt_chart",
  SPREADSHEET = "spreadsheet",
}

export enum EIssueServiceType {
  ISSUES = "issues",
  EPICS = "epics",
  WORK_ITEMS = "work-items",
}

export enum EIssuesStoreType {
  GLOBAL = "GLOBAL",
  PROFILE = "PROFILE",
  TEAM = "TEAM",
  PROJECT = "PROJECT",
  CYCLE = "CYCLE",
  MODULE = "MODULE",
  TEAM_VIEW = "TEAM_VIEW",
  PROJECT_VIEW = "PROJECT_VIEW",
  ARCHIVED = "ARCHIVED",
  DEFAULT = "DEFAULT",
  WORKSPACE_DRAFT = "WORKSPACE_DRAFT",
  EPIC = "EPIC",
  TEAM_PROJECT_WORK_ITEMS = "TEAM_PROJECT_WORK_ITEMS",
}

export type TOppositionTeam = {
  name: string;
  logo: string;
};

export type TCoachingCardClip = {
  key: string;
  id: string;
  title: string;
  thumbnail: string | null;
  duration_seconds: number | null;
  timecode: string;
  team: string;
  detail: string;
  result: string;
  secondary_detail: string;
  group: string;
};

export type TCoachingCardPlaylist = {
  id: string;
  name: string;
  clips: TCoachingCardClip[];
};

export type TCoachingCardData = {
  schema_version: 1;
  kind: "coaching_card";
  request_id: string;
  source_issue: {
    id: string;
    name: string;
    sequence_id: number;
    sg_event_id: string | number | null;
  };
  player: {
    id: string;
    name: string;
    jersey_number: string;
    position: string;
  };
  sport: string;
  feedback: string;
  progress_status: string;
  playlists: TCoachingCardPlaylist[];
  summary: {
    playlist_count: number;
    clip_count: number;
    primary_thumbnail: string | null;
    primary_clip_title: string;
  };
};

export type TCreateCoachingCardsPayload = {
  request_id: string;
  source_issue_id: string;
  player_ids: string[];
  feedback: string;
  progress_status: string;
  sport_label: string;
  playlists: TCoachingCardPlaylist[];
};

export type TCreateCoachingCardsResponse = {
  created_count: number;
  idempotent_replay: boolean;
  cards: Array<{
    id: string;
    name: string;
    sequence_id: number;
    project_id: string;
    state_id: string;
    parent_id: string;
    category: string;
    roster_player_id: string;
    coaching_card_data: TCoachingCardData;
  }>;
};

export type TBaseIssue = {
  id: string;
  sequence_id: number;
  name: string;
  sort_order: number;
  sg_event_id: string | number | null;
  opposition_team: TOppositionTeam | string | null;

  state_id: string | null;
  priority: TIssuePriorities | null;
  label_ids: string[];
  assignee_ids: string[];
  estimate_point: string | null;

  sub_issues_count: number;
  attachment_count: number;
  link_count: number;

  project_id: string | null;
  parent_id: string | null;
  cycle_id: string | null;
  module_ids: string[] | null;
  type_id: string | null;

  created_at: string;
  updated_at: string;
  start_date: string | null;
  start_time: string | null;
  target_date: string | null;
  completed_at: string | null;
  archived_at: string | null;

  created_by: string;
  updated_by: string;

  // Sport App Fields
  level: string | null;
  program: string | null;
  sport: string | null;
  year: string | null;
  category: string | null;
  roster_player_id?: string | null;
  coaching_card_data?: TCoachingCardData | null;

  is_draft: boolean;
  is_epic?: boolean;
  is_intake?: boolean;
};

export type IssueRelation = {
  id: string;
  name: string;
  project_id: string;
  relation_type: TIssueRelationTypes;
  sequence_id: number;
};

export type TIssue = TBaseIssue & {
  description_html?: string;
  is_subscribed?: boolean;
  parent?: Partial<TBaseIssue>;
  issue_reactions?: TIssueReaction[];
  issue_attachments?: TIssueAttachment[];
  issue_link?: TIssueLink[];
  issue_relation?: IssueRelation[];
  issue_related?: IssueRelation[];
  // tempId is used for optimistic updates. It is not a part of the API response.
  tempId?: string;
  // sourceIssueId is used to store the original issue id when creating a copy of an issue. Used in cloning property values. It is not a part of the API response.
  sourceIssueId?: string;
  state__group?: string | null;
};

export type TIssueMap = {
  [issue_id: string]: TIssue;
};

export type TIssueResponseResults =
  | TBaseIssue[]
  | {
      [key: string]: {
        results:
          | TBaseIssue[]
          | {
              [key: string]: {
                results: TBaseIssue[];
                total_results: number;
              };
            };
        total_results: number;
      };
    };

export type TIssuesResponse = {
  grouped_by: string;
  next_cursor: string;
  prev_cursor: string;
  next_page_results: boolean;
  prev_page_results: boolean;
  total_count: number;
  count: number;
  total_pages: number;
  extra_stats: null;
  results: TIssueResponseResults;
  total_results: number;
};

export type TBulkIssueProperties = Pick<
  TIssue,
  | "state_id"
  | "priority"
  | "label_ids"
  | "assignee_ids"
  | "start_date"
  | "start_time"
  | "target_date"
  | "module_ids"
  | "cycle_id"
  | "estimate_point"
  | "level"
  | "sport"
  | "program"
  | "year"
  | "category"
>;

export type TBulkOperationsPayload = {
  issue_ids: string[];
  properties: Partial<TBulkIssueProperties>;
};

export type TWorkItemWidgets = "sub-work-items" | "relations" | "links" | "attachments";

export type TIssueServiceType = EIssueServiceType.ISSUES | EIssueServiceType.EPICS | EIssueServiceType.WORK_ITEMS;

export interface IPublicIssue extends Pick<
  TIssue,
  | "description_html"
  | "created_at"
  | "updated_at"
  | "created_by"
  | "id"
  | "name"
  | "priority"
  | "state_id"
  | "project_id"
  | "sequence_id"
  | "sort_order"
  | "start_date"
  | "start_time"
  | "target_date"
  | "cycle_id"
  | "module_ids"
  | "label_ids"
  | "assignee_ids"
  | "attachment_count"
  | "sub_issues_count"
  | "link_count"
  | "estimate_point"
  | "level"
  | "sport"
  | "program"
  | "year"
  | "category"
> {
  comments: TIssuePublicComment[];
  reaction_items: IIssuePublicReaction[];
  vote_items: IPublicVote[];
}

export type TPublicIssueResponseResults =
  | IPublicIssue[]
  | {
      [key: string]: {
        results:
          | IPublicIssue[]
          | {
              [key: string]: {
                results: IPublicIssue[];
                total_results: number;
              };
            };
        total_results: number;
      };
    };

export type TPublicIssuesResponse = {
  grouped_by: string;
  next_cursor: string;
  prev_cursor: string;
  next_page_results: boolean;
  prev_page_results: boolean;
  total_count: number;
  count: number;
  total_pages: number;
  extra_stats: null;
  results: TPublicIssueResponseResults;
};

export interface IWorkItemPeekOverview {
  embedIssue?: boolean;
  embedRemoveCurrentNotification?: () => void;
  is_draft?: boolean;
  storeType?: EIssuesStoreType;
}

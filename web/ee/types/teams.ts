import { ReactNode } from "react";
// plane imports
import { EIssueCommentAccessSpecifier } from "@plane/constants";
import { TWorkspaceBaseActivity, TBaseActivityVerbs, IUserLite } from "@plane/types";

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

export type TTeamActivityDetails = {
  icon: ReactNode;
  message: ReactNode;
  customUserName?: string;
};

export type TTeamActivityDetailsHelperMap = {
  [key in TTeamActivityKeys]: (activity: TTeamActivity) => TTeamActivityDetails;
};

export type TTeamReaction = {
  id: string;
  reaction: string;
  actor: string;
  actor_detail: IUserLite;
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

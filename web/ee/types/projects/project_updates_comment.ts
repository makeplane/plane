import { EIssueCommentAccessSpecifier } from "@plane/constants";
import {
  TIssueActivityUserDetail,
  TIssueActivityWorkspaceDetail,
  TIssueActivityProjectDetail,
  TIssueActivityIssueDetail,
} from "@plane/types";
import { TProjectUpdateReaction } from "./update_reaction";

export type TProjectUpdatesComment = {
  id: string;
  workspace: string;
  workspace_detail: TIssueActivityWorkspaceDetail;
  project: string;
  project_detail: TIssueActivityProjectDetail;
  issue: string;
  issue_detail: TIssueActivityIssueDetail;
  actor: string;
  actor_detail: TIssueActivityUserDetail;
  created_at: string;
  updated_at: string;
  created_by: string | undefined;
  updated_by: string | undefined;
  attachments: any[];
  comment_reactions: any[];
  comment_stripped: string;
  description: string;
  comment_json: object;
  external_id: string | undefined;
  external_source: string | undefined;
  access: EIssueCommentAccessSpecifier;
  update_reactions: TProjectUpdateReaction[];
};

export type TProjectUpdatesCommentMap = {
  [update_id: string]: string[];
};

export type TProjectUpdatesCommentIdMap = {
  [update_id: string]: string[];
};

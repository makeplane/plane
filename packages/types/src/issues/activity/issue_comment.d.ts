import {
  TIssueActivityWorkspaceDetail,
  TIssueActivityProjectDetail,
  TIssueActivityIssueDetail,
  TIssueActivityUserDetail,
} from "./base";
import { EIssueCommentAccessSpecifier } from "../../enums";
import { TFileSignedURLResponse } from "../../file";
import { IUserLite } from "../../users";

export type TCommentReaction = {
  id: string;
  reaction: string;
  actor: string;
  actor_detail: IUserLite;
};
export type TIssueComment = {
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
  edited_at?: string | undefined;
  updated_at: string;
  created_by: string | undefined;
  updated_by: string | undefined;
  attachments: any[];
  comment_reactions: any[];
  comment_stripped: string;
  comment_html: string;
  comment_json: object;
  external_id: string | undefined;
  external_source: string | undefined;
  access: EIssueCommentAccessSpecifier;
};

export type TCommentsOperations = {
  createComment: (data: Partial<TIssueComment>) => Promise<Partial<TIssueComment> | undefined>;
  updateComment: (commentId: string, data: Partial<TIssueComment>) => Promise<void>;
  removeComment: (commentId: string) => Promise<void>;
  uploadCommentAsset: (blockId: string, file: File, commentId?: string) => Promise<TFileSignedURLResponse>;
  addCommentReaction: (commentId: string, reactionEmoji: string) => Promise<void>;
  deleteCommentReaction: (commentId: string, reactionEmoji: string, userReactions: TCommentReaction[]) => Promise<void>;
  react: (commentId: string, reactionEmoji: string, userReactions: string[]) => Promise<void>;
  reactionIds: (commentId: string) =>
    | {
        [reaction: string]: string[];
      }
    | undefined;
  userReactions: (commentId: string) => string[] | undefined;
  getReactionUsers: (reaction: string, reactionIds: Record<string, string[]>) => string;
};

export type TIssueCommentMap = {
  [issue_id: string]: TIssueComment;
};

export type TIssueCommentIdMap = {
  [issue_id: string]: string[];
};

export type TIssuePublicComment = {
  actor_detail: ActorDetail;
  access: string;
  actor: string;
  attachments: any[];
  comment_html: string;
  comment_reactions: {
    actor_detail: ActorDetail;
    comment: string;
    id: string;
    reaction: string;
  }[];
  comment_stripped: string;
  created_at: Date;
  created_by: string;
  id: string;
  is_member: boolean;
  issue: string;
  issue_detail: IssueDetail;
  project: string;
  project_detail: ProjectDetail;
  updated_at: Date;
  updated_by: string;
  workspace: string;
  workspace_detail: IWorkspaceLite;
};

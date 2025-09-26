import type { JSONContent } from "../editor";
import { IUserLite } from "../users";
import { IWorkspaceLite } from "../workspace";

export type TPageCommentReaction = {
  id: string;
  workspace: string;
  comment: string;
  actor: string;
  actor_detail: IUserLite;
  reaction: string;
  project: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
};

export type TPageCommentDescription = {
  description_html: string;
  description_json: JSONContent;
  description_stripped?: string;
  description_binary?: string | null;
};

export type TPageComment = {
  id: string;
  workspace: string;
  workspace_detail: IWorkspaceLite;
  page: string;
  project: string | null;
  actor: string;
  actor_detail: IUserLite;
  description: TPageCommentDescription;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  parent: string | null;
  parent_id: string | null;
  page_comment_reactions: TPageCommentReaction[];
  is_resolved: boolean;
  comment_stripped?: string;
  resolved_at: string | null;
  resolved_by: string | null;
  node_id: string | null;
  external_id: string | null;
  external_source: string | null;
  // Computed fields
  replies?: TPageComment[];
  reactions?: {
    [reaction: string]: string[];
  };
  total_replies?: number;
  reference_stripped: string;
};

export type TPageCommentOperations = {
  fetchComments: () => Promise<TPageComment[]>;
  createComment: (data: Partial<TPageComment>) => Promise<TPageComment>;
  updateComment: (commentId: string, data: Partial<TPageComment>) => Promise<TPageComment>;
  deleteComment: (commentId: string) => Promise<void>;
  resolveComment: (commentId: string) => Promise<void>;
  unresolveComment: (commentId: string) => Promise<void>;
  addReaction: (commentId: string, reaction: string) => Promise<TPageCommentReaction>;
  removeReaction: (commentId: string, reaction: string) => Promise<void>;
  // Computed helpers
  getCommentsForNode: (nodeId: string) => TPageComment[];
  getThreadedComments: () => TPageComment[];
  getUserReactions: (commentId: string) => string[];
  getReactionsByType: (commentId: string) => { [reaction: string]: string[] };
};

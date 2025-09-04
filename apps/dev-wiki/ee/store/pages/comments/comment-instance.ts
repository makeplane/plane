import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types
import type {
  TPageCommentDescription,
  TPageComment,
  TPageCommentReaction,
  IUserLite,
  IWorkspaceLite,
} from "@plane/types";
// store
import type { CommentStore } from "./comment.store";

export type TCommentInstance = TPageComment & {
  // computed properties
  isRootComment: boolean;
  hasReplies: boolean;
  childComments: TCommentInstance[];
  threadComments: TCommentInstance[]; // all comments in this thread (parent + children)

  // methods
  updateProperties: (data: Partial<TPageComment>) => void;
};

export class CommentInstance implements TCommentInstance {
  id: string = "";
  workspace: string = "";
  workspace_detail: IWorkspaceLite = {} as IWorkspaceLite;
  page: string = "";
  project: string | null = null;
  actor: string = "";
  actor_detail: IUserLite = {} as IUserLite;
  description: TPageCommentDescription = {
    description_html: "",
    description_json: {},
    description_stripped: "",
  };
  comment_stripped: string | undefined = "";
  created_at: string = "";
  updated_at: string = "";
  created_by: string = "";
  updated_by: string = "";
  parent: string | null = null;
  parent_id: string | null = null;
  page_comment_reactions: TPageCommentReaction[] = [];
  is_resolved: boolean = false;
  resolved_at: string | null = null;
  resolved_by: string | null = null;
  node_id: string | null = null;
  external_id: string | null = null;
  external_source: string | null = null;
  // Optional computed fields
  replies?: TPageComment[];
  reactions?: { [reaction: string]: string[] };
  total_replies: number = 0;
  reference_stripped: string = "";

  // Store reference
  private store: CommentStore;

  constructor(store: CommentStore, comment: TPageComment) {
    this.store = store;

    // Initialize all properties
    this.id = comment.id;
    this.workspace = comment.workspace;
    this.workspace_detail = comment.workspace_detail;
    this.page = comment.page;
    this.project = comment.project;
    this.actor = comment.actor;
    this.actor_detail = comment.actor_detail;
    this.comment_stripped = comment.comment_stripped;
    this.created_at = comment.created_at;
    this.updated_at = comment.updated_at;
    this.created_by = comment.created_by;
    this.updated_by = comment.updated_by;
    this.parent = comment.parent;
    this.parent_id = comment.parent_id;
    this.page_comment_reactions = comment.page_comment_reactions;
    this.is_resolved = comment.is_resolved;
    this.resolved_at = comment.resolved_at;
    this.resolved_by = comment.resolved_by;
    this.node_id = comment.node_id;
    this.external_id = comment.external_id;
    this.external_source = comment.external_source;
    this.replies = comment.replies;
    this.reactions = comment.reactions;
    this.total_replies = comment.total_replies || 0;
    this.reference_stripped = comment.reference_stripped;
    this.description = comment.description;

    makeObservable(this, {
      // observables
      id: observable.ref,
      workspace: observable.ref,
      workspace_detail: observable,
      page: observable.ref,
      project: observable.ref,
      actor: observable.ref,
      actor_detail: observable,
      comment_stripped: observable,
      description: observable,
      created_at: observable.ref,
      updated_at: observable.ref,
      created_by: observable.ref,
      updated_by: observable.ref,
      parent: observable.ref,
      parent_id: observable.ref,
      page_comment_reactions: observable,
      is_resolved: observable.ref,
      resolved_at: observable.ref,
      resolved_by: observable.ref,
      node_id: observable.ref,
      external_id: observable.ref,
      external_source: observable.ref,
      replies: observable,
      reactions: observable,
      total_replies: observable.ref,
      reference_stripped: observable.ref,

      // computed
      isRootComment: computed,
      hasReplies: computed,
      childComments: computed,
      threadComments: computed,

      // actions
      updateProperties: action,
    });
  }

  // Computed properties
  get isRootComment(): boolean {
    return this.parent_id === null;
  }

  get hasReplies(): boolean {
    return this.total_replies > 0;
  }

  get childComments(): TCommentInstance[] {
    return this.store.getCommentsByParentId(this.id);
  }

  get threadComments(): TCommentInstance[] {
    if (this.isRootComment) {
      // If this is a root comment, return this + all children
      return [this, ...this.childComments].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else {
      // If this is a child comment, find the root and return its thread
      const rootComment = this.store.getCommentById(this.parent_id!);
      return rootComment ? rootComment.threadComments : [this];
    }
  }

  // Methods
  updateProperties = (data: Partial<TPageComment>) => {
    runInAction(() => {
      Object.keys(data).forEach((key) => {
        const typedKey = key as keyof TPageComment;
        if (data[typedKey] !== undefined) {
          (this as Record<keyof TPageComment, unknown>)[typedKey] = data[typedKey];
        }
      });
    });
  };
}

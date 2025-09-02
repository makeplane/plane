import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { TPageComment, TPageCommentReaction } from "@plane/types";
// services
import { ConfigurablePageCommentService } from "@/plane-web/services/page/page-comment.service";
import { type RootStore } from "@/plane-web/store/root.store";
// local imports
import { CommentInstance, TCommentInstance } from "./comment-instance";

// Types for comment configuration
type PageWithConfig = {
  id?: string;
  _config: Record<string, string> | null;
  _getBasePath: ((params: { pageId: string; config: Record<string, string> }) => string) | null;
};

export type TCommentFilters = {
  showAll: boolean;
  showActive: boolean;
  showResolved: boolean;
};

export interface ICommentStore {
  // observables
  comments: Map<string, TCommentInstance>;
  commentsFilters: TCommentFilters;
  commentsOrder: string[];
  pendingScrollToComment: string | null;

  // computed methods
  getCommentById: (commentId: string) => TCommentInstance | undefined;
  getCommentsByParentId: (parentId: string) => TCommentInstance[];
  // computed properties
  baseComments: TCommentInstance[];
  filteredBaseComments: TCommentInstance[];
  isEmpty: boolean;

  // actions
  removeCommentFromStore: (commentId: string) => void;
  updateCommentFilters: (filterKey: keyof TCommentFilters) => void;
  updateCommentsOrder: (commentsOrder: string[]) => void;
  setPendingScrollToComment: (commentId: string | null) => void;

  // API actions - now context-aware (no need to pass pageId/config)
  fetchPageComments: () => Promise<void>;
  fetchThreadComments: (threadId: string) => Promise<void>;
  createComment: (data: Partial<TPageComment>) => Promise<TCommentInstance>;
  deleteComment: (commentId: string) => Promise<void>;
  restoreComment: (commentId: string) => Promise<void>;
  resolveComment: (commentId: string) => Promise<void>;
  unresolveComment: (commentId: string) => Promise<void>;
  addReaction: (commentId: string, reaction: string) => Promise<TPageCommentReaction>;
  removeReaction: (commentId: string, reaction: string) => Promise<void>;
  updateComment: (commentId: string, data: Partial<TPageComment>) => Promise<TPageComment>;
}

export class CommentStore implements ICommentStore {
  // observables
  comments: Map<string, TCommentInstance> = new Map();
  commentsFilters: TCommentFilters = {
    showAll: true,
    showActive: false,
    showResolved: false,
  };
  commentsOrder: string[] = [];
  pendingScrollToComment: string | null = null;

  // services
  private commentService: ConfigurablePageCommentService;
  rootStore: RootStore;
  private page: PageWithConfig;

  // Callback for scroll after order sync
  onScrollToPendingComment: ((commentId: string) => void) | null = null;

  constructor(rootStore: RootStore, page: PageWithConfig) {
    this.rootStore = rootStore;
    this.page = page;

    // Create service with dynamic getBasePath
    this.commentService = new ConfigurablePageCommentService(
      (params: { pageId: string; config: Record<string, string> }): string => {
        const getBasePath = this.page._getBasePath;
        if (!getBasePath) {
          throw new Error("getBasePath not configured - ensure setConfig was called with getBasePath parameter");
        }
        return getBasePath(params);
      }
    );

    makeObservable(this, {
      // observables
      comments: observable,
      commentsFilters: observable,
      commentsOrder: observable,
      pendingScrollToComment: observable,

      // computed
      baseComments: computed,
      filteredBaseComments: computed,
      isEmpty: computed,

      // actions
      removeCommentFromStore: action,
      updateCommentFilters: action,
      updateCommentsOrder: action,
      setPendingScrollToComment: action,
      fetchPageComments: action,
      fetchThreadComments: action,
      createComment: action,
      deleteComment: action,
      restoreComment: action,
      resolveComment: action,
      unresolveComment: action,
      addReaction: action,
      removeReaction: action,
      updateComment: action,
    });
  }

  // Helper method to get page context
  private getPageContext(): { pageId: string; config: Record<string, string> } {
    const pageId = this.page.id;
    const config = this.page._config;

    if (!pageId || !config) {
      throw new Error("Page context not available - ensure setConfig was called on the page");
    }

    return { pageId, config };
  }

  // Computed methods using computedFn for better performance
  getCommentById = computedFn((commentId: string): TCommentInstance | undefined => this.comments.get(commentId));

  getCommentsByParentId = computedFn((threadId: string): TCommentInstance[] => {
    const parentComment = this.comments.get(threadId);
    if (!parentComment) return [];

    const allCommentsInThread = Array.from(this.comments.values()).filter((comment) => comment.parent_id === threadId);
    console.log("asome", allCommentsInThread);

    return allCommentsInThread.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  });

  get baseComments(): TCommentInstance[] {
    const allComments = Array.from(this.comments.values());
    const comments = allComments.filter((comment) => !comment.parent_id);

    // If we have a custom order from the editor, use it
    if (this.commentsOrder.length > 0) {
      // Create a map for quick order lookup
      const orderMap = new Map(this.commentsOrder.map((id, index) => [id, index]));

      return comments.sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const orderB = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;

        // If both have custom order, use that
        if (orderA !== Number.MAX_SAFE_INTEGER && orderB !== Number.MAX_SAFE_INTEGER) {
          return orderA - orderB;
        }

        // If only one has custom order, it comes first
        if (orderA !== Number.MAX_SAFE_INTEGER) return -1;
        if (orderB !== Number.MAX_SAFE_INTEGER) return 1;

        // Neither has custom order, fall back to creation time (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    // Default sorting by creation time (newest first)
    return comments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  get filteredBaseComments(): TCommentInstance[] {
    if (this.commentsFilters.showAll) {
      return this.baseComments;
    }

    return this.baseComments.filter((comment) => {
      if (this.commentsFilters.showActive && !comment.is_resolved) return true;
      if (this.commentsFilters.showResolved && comment.is_resolved) return true;
      return false;
    });
  }

  get isEmpty() {
    return this.baseComments.length === 0;
  }

  // Store management actions
  removeCommentFromStore = (commentId: string) => {
    runInAction(() => {
      this.comments.delete(commentId);
    });
  };

  updateCommentFilters = (filterKey: keyof TCommentFilters) => {
    runInAction(() => {
      if (filterKey === "showAll") {
        this.commentsFilters.showAll = !this.commentsFilters.showAll;
        if (this.commentsFilters.showAll) {
          this.commentsFilters.showActive = false;
          this.commentsFilters.showResolved = false;
        }
      } else {
        this.commentsFilters[filterKey] = !this.commentsFilters[filterKey];
        if (this.commentsFilters.showActive || this.commentsFilters.showResolved) {
          this.commentsFilters.showAll = false;
        }
      }
    });
  };

  setPendingScrollToComment = (commentId: string | null) => {
    runInAction(() => {
      this.pendingScrollToComment = commentId;
    });
  };

  updateCommentsOrder = (commentsOrder: string[]) => {
    runInAction(() => {
      const previousOrder = [...this.commentsOrder];
      this.commentsOrder = commentsOrder;

      // If we have a pending scroll comment and the order actually changed,
      // and the pending comment is now in the new order, trigger scroll
      if (
        this.pendingScrollToComment &&
        JSON.stringify(previousOrder) !== JSON.stringify(commentsOrder) &&
        commentsOrder.includes(this.pendingScrollToComment)
      ) {
        // Trigger scroll via a callback that will be set by the UI component
        if (this.onScrollToPendingComment) {
          this.onScrollToPendingComment(this.pendingScrollToComment);
          this.pendingScrollToComment = null;
        }
      }
    });
  };

  // API actions
  fetchPageComments = async (): Promise<void> => {
    const { pageId, config } = this.getPageContext();

    try {
      const comments = await this.commentService.list({ pageId, config });

      runInAction(() => {
        // Add all comments to store, updating existing instances
        comments.forEach((comment) => {
          if (comment.id) {
            if (this.comments.has(comment.id)) {
              // Update existing instance
              this.comments.get(comment.id)!.updateProperties(comment);
            } else {
              // Create new instance
              this.comments.set(comment.id, new CommentInstance(this, comment));
            }
          }
        });
      });
    } catch (error) {
      console.error("Failed to fetch page comments:", error);
      throw error;
    }
  };

  fetchThreadComments = async (threadId: string): Promise<void> => {
    if (!threadId) return;

    const { pageId, config } = this.getPageContext();

    try {
      const threadComments = await this.commentService.retrieveThread({ pageId, config, commentId: threadId });

      runInAction(() => {
        // Add all thread comments to store, updating existing instances
        threadComments.forEach((comment) => {
          if (comment.id) {
            if (this.comments.has(comment.id)) {
              // Update existing instance
              this.comments.get(comment.id)!.updateProperties(comment);
            } else {
              // Create new instance
              this.comments.set(comment.id, new CommentInstance(this, comment));
            }
          }
        });
      });
    } catch (error) {
      console.error("Failed to fetch thread comments:", error);
      throw error;
    }
  };

  createComment = async (data: Partial<TPageComment>): Promise<TCommentInstance> => {
    const { pageId, config } = this.getPageContext();

    // Make API call first - no optimistic updates for creation
    const comment = await this.commentService.create({ pageId, config, data });

    runInAction(() => {
      if (comment.id) {
        this.comments.set(comment.id, new CommentInstance(this, comment));
      }
    });

    if (!comment.id) {
      throw new Error("Created comment is missing an id");
    }

    return this.comments.get(comment.id)!;
  };

  deleteComment = async (commentId: string): Promise<void> => {
    const { pageId, config } = this.getPageContext();

    await this.commentService.destroy({ pageId, config, commentId });

    runInAction(() => {
      this.comments.delete(commentId);
    });
  };

  restoreComment = async (commentId: string): Promise<void> => {
    const { pageId, config } = this.getPageContext();

    await this.commentService.restore({ pageId, config, commentId });

    const comment = await this.commentService.retrieve({ pageId, config, commentId });
    runInAction(() => {
      if (this.comments.has(commentId)) {
        this.comments.get(commentId)!.updateProperties(comment);
      } else {
        this.comments.set(commentId, new CommentInstance(this, comment));
      }
    });
  };

  resolveComment = async (commentId: string): Promise<void> => {
    const { pageId, config } = this.getPageContext();

    // Make API call first - no optimistic updates
    await this.commentService.resolve({ pageId, config, commentId });

    runInAction(() => {
      const comment = this.comments.get(commentId);
      if (comment) {
        comment.is_resolved = true;
        comment.resolved_at = new Date().toISOString();
        comment.resolved_by = this.rootStore.user.data?.id || null;
      }
    });
  };

  unresolveComment = async (commentId: string): Promise<void> => {
    const { pageId, config } = this.getPageContext();

    // Make API call first - no optimistic updates
    await this.commentService.unresolve({ pageId, config, commentId });

    runInAction(() => {
      const comment = this.comments.get(commentId);
      if (comment) {
        comment.is_resolved = false;
        comment.resolved_at = null;
        comment.resolved_by = null;
      }
    });
  };

  addReaction = async (commentId: string, reaction: string): Promise<TPageCommentReaction> => {
    const { pageId, config } = this.getPageContext();

    const reactionData = await this.commentService.addReaction({
      pageId,
      commentId,
      reaction,
      config,
    });

    runInAction(() => {
      const comment = this.comments.get(commentId);
      if (comment) {
        comment.page_comment_reactions.push(reactionData);
      }
    });

    return reactionData;
  };

  removeReaction = async (commentId: string, reaction: string): Promise<void> => {
    const { pageId, config } = this.getPageContext();

    await this.commentService.removeReaction({
      pageId,
      commentId,
      reaction,
      config,
    });

    runInAction(() => {
      const comment = this.comments.get(commentId);
      if (comment) {
        comment.page_comment_reactions = comment.page_comment_reactions.filter((r) => r.reaction !== reaction);
      }
    });
  };

  updateComment = async (commentId: string, data: Partial<TPageComment>): Promise<TPageComment> => {
    const { pageId, config } = this.getPageContext();

    const updatedComment = await this.commentService.update({
      pageId,
      commentId,
      data,
      config,
    });

    runInAction(() => {
      const comment = this.comments.get(commentId);
      if (comment) {
        comment.updateProperties(updatedComment);
      }
    });

    return updatedComment;
  };
}

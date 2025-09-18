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
  getLatestReplyByParentId: (parentId: string) => TCommentInstance | undefined;
  getThreadDisplayState: (
    threadId: string,
    showReplies: boolean
  ) => {
    shouldShowReplyController: boolean;
    hiddenRepliesCount: number;
    displayItems: Array<{ comment: TCommentInstance }>;
    totalReplies: number;
    loadedRepliesCount: number;
  } | null;
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
  fetchThreadComments: (threadId: string) => Promise<TPageComment[]>;
  getOrFetchInstance: (
    commentId: string,
    options?: { restoreOn404?: boolean }
  ) => Promise<TCommentInstance | undefined>;
  createComment: (data: Partial<TPageComment>) => Promise<TCommentInstance>;
  deleteComment: (commentId: string) => Promise<void>;
  restoreComment: (commentId: string) => Promise<void>;
  resolveComment: (commentId: string) => Promise<void>;
  unresolveComment: (commentId: string) => Promise<void>;
  addReaction: (commentId: string, reaction: string) => Promise<TPageCommentReaction>;
  removeReaction: (commentId: string, reaction: string) => Promise<void>;
  updateComment: (commentId: string, data: Partial<TPageComment>) => Promise<void>;
}

export class CommentStore implements ICommentStore {
  // observables
  comments: Map<string, TCommentInstance> = new Map();
  commentsFilters: TCommentFilters = {
    showAll: false,
    showActive: true,
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
      getOrFetchInstance: action,
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

  private isNotFoundError(error: unknown): boolean {
    if (!error) return false;

    if (Array.isArray(error)) {
      return error.some((entry) => typeof entry === "string" && entry.toLowerCase().includes("not found"));
    }

    if (typeof error !== "object") return false;

    const errorObject = error as Record<string, unknown>;

    const statusCandidates = [errorObject.status, errorObject.status_code, errorObject.statusCode, errorObject.code];
    if (statusCandidates.some((value) => value === 404 || value === "404")) {
      return true;
    }

    const detailCandidates = [errorObject.detail, errorObject.message, errorObject.error];

    return detailCandidates.some((candidate) => {
      if (typeof candidate === "string") {
        const normalized = candidate.toLowerCase();
        return normalized.includes("not found") || normalized.includes("deleted");
      }
      if (Array.isArray(candidate)) {
        return candidate.some((entry) => typeof entry === "string" && entry.toLowerCase().includes("not found"));
      }
      return false;
    });
  }

  // Computed methods using computedFn for better performance
  getCommentById = computedFn((commentId: string): TCommentInstance | undefined => this.comments.get(commentId));

  getCommentsByParentId = computedFn((threadId: string): TCommentInstance[] => {
    const parentComment = this.comments.get(threadId);
    if (!parentComment) return [];

    const allCommentsInThread = Array.from(this.comments.values()).filter((comment) => comment.parent_id === threadId);

    return allCommentsInThread.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  });

  getLatestReplyByParentId = computedFn((threadId: string): TCommentInstance | undefined => {
    const replies = this.getCommentsByParentId(threadId);
    if (replies.length === 0) return undefined;

    // Return the latest reply (last in the sorted array)
    return replies[replies.length - 1];
  });

  getThreadDisplayState = computedFn((threadId: string, showReplies: boolean) => {
    const parentComment = this.getCommentById(threadId);
    if (!parentComment) return null;

    const replies = this.getCommentsByParentId(threadId);
    const totalReplies = parentComment.total_replies || 0;

    // Calculate how many replies are hidden (not loaded yet)
    const hiddenRepliesCount = totalReplies - 1;

    const shouldShowReplyController = hiddenRepliesCount > 0;

    // Always show the latest reply if there are any replies
    // showReplies controls whether to show the rest (older replies)
    let displayItems: Array<{ comment: TCommentInstance }> = [];

    if (replies.length > 0) {
      if (showReplies) {
        // Show all loaded replies when expanded
        displayItems = replies.map((comment) => ({ comment }));
      } else {
        // Show only the latest reply when collapsed
        const latestReply = replies[replies.length - 1];
        displayItems = [{ comment: latestReply }];
      }
    }

    return {
      shouldShowReplyController,
      hiddenRepliesCount,
      displayItems,
      totalReplies,
      loadedRepliesCount: replies.length,
    };
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

      // Detect new comment IDs that were added to the order
      const newCommentIds = commentsOrder.filter((id) => !previousOrder.includes(id));

      // Fetch any missing comments for new IDs
      if (newCommentIds.length > 0) {
        Promise.all(newCommentIds.map((commentId) => this.getOrFetchInstance(commentId, { restoreOn404: true }))).catch(
          (error) => {
            console.error("Failed to fetch some comments from order update:", error);
          }
        );
      }

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

  getOrFetchInstance = async (
    commentId: string,
    options?: { restoreOn404?: boolean }
  ): Promise<TCommentInstance | undefined> => {
    // Return existing comment if found
    if (this.comments.has(commentId)) {
      return this.comments.get(commentId);
    }

    try {
      // Fetch missing comment from API
      const { pageId, config } = this.getPageContext();
      const comment = await this.commentService.retrieve({ pageId, config, commentId });

      runInAction(() => {
        this.comments.set(commentId, new CommentInstance(this, comment));
      });

      return this.comments.get(commentId);
    } catch (error) {
      const shouldAttemptRestore = options?.restoreOn404 && this.isNotFoundError(error);

      if (shouldAttemptRestore) {
        try {
          console.warn(`Comment ${commentId} not found during order sync. Attempting restore.`);
          await this.restoreComment(commentId);
          return this.comments.get(commentId);
        } catch (restoreError) {
          console.error(`Failed to restore comment ${commentId} after not-found response:`, restoreError);
        }
      } else {
        console.error(`Failed to fetch comment ${commentId}:`, error);
      }

      return undefined;
    }
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

  fetchThreadComments = async (threadId: string): Promise<TPageComment[]> => {
    if (!threadId) return [];

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
      return threadComments;
    } catch (error) {
      console.error("Failed to fetch thread comments:", error);
      throw error;
    }
  };

  createComment = async (data: Partial<TPageComment>): Promise<TCommentInstance> => {
    const { pageId, config } = this.getPageContext();

    // Make API call first - no optimistic updates for creation
    const comment = await this.commentService.create({ pageId, config, data });

    if (data.parent_id) {
      const parentCommentInstance = this.getCommentById(data.parent_id);
      if (parentCommentInstance && parentCommentInstance.total_replies != null) {
        parentCommentInstance.total_replies++;
      }
    }

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
    const commentInstance = this.getCommentById(commentId);
    if (!commentInstance) {
      throw new Error("Comment instance not found while deleting");
    }

    if (commentInstance.parent_id) {
      const parentCommentInstance = this.getCommentById(commentInstance.parent_id);
      if (parentCommentInstance && parentCommentInstance.total_replies != null) {
        parentCommentInstance.total_replies--;
      }
    }

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
    const commentInstance = this.comments.get(commentId);

    if (!commentInstance) {
      throw new Error(`Comment with ID ${commentId} not found`);
    }

    runInAction(() => {
      commentInstance.is_resolved = true;
      commentInstance.resolved_at = new Date().toISOString();
      commentInstance.resolved_by = this.rootStore.user.data?.id || null;
    });

    await this.commentService.resolve({ pageId, config, commentId }).catch((error) => {
      console.error("Failed to resolve comment:", error);
      runInAction(() => {
        commentInstance.is_resolved = false;
        commentInstance.resolved_at = null;
        commentInstance.resolved_by = null;
      });
      throw error;
    });
  };

  unresolveComment = async (commentId: string): Promise<void> => {
    const { pageId, config } = this.getPageContext();
    const commentInstance = this.comments.get(commentId);
    if (!commentInstance) {
      throw new Error(`Comment with ID ${commentId} not found`);
    }

    const oldValues = {
      is_resolved: commentInstance.is_resolved,
      resolved_at: commentInstance.resolved_at,
      resolved_by: commentInstance.resolved_by,
    };

    runInAction(() => {
      commentInstance.is_resolved = false;
      commentInstance.resolved_at = null;
      commentInstance.resolved_by = null;
    });

    await this.commentService.unresolve({ pageId, config, commentId }).catch((error) => {
      console.error("Failed to unresolve comment:", error);
      runInAction(() => {
        commentInstance.is_resolved = oldValues.is_resolved;
        commentInstance.resolved_at = oldValues.resolved_at;
        commentInstance.resolved_by = oldValues.resolved_by;
      });
      throw error;
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
      const comment = this.getCommentInstance(commentId);
      if (comment) {
        comment.page_comment_reactions = comment.page_comment_reactions.filter((r) => r.reaction !== reaction);
      }
    });
  };

  getCommentInstance = (commentId: string): TCommentInstance | undefined => this.comments.get(commentId);

  updateComment = async (commentId: string, data: Partial<TPageComment>): Promise<void> => {
    const { pageId, config } = this.getPageContext();
    const commentInstance = this.getCommentInstance(commentId);
    const oldValues = commentInstance?.asJSON;

    if (!commentInstance) {
      throw new Error(`Comment with ID ${commentId} not found`);
    }

    runInAction(() => {
      commentInstance.updateProperties(data);
    });

    await this.commentService
      .update({
        pageId,
        commentId,
        data,
        config,
      })
      .catch((error) => {
        runInAction(() => {
          if (oldValues) {
            commentInstance.updateProperties(oldValues);
          }
        });
        throw error;
      });
  };
}

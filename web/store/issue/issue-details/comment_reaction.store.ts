import { action, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// services
import { IssueReactionService } from "services/issue";
// types
import { IIssueDetail } from "./root.store";
import { TIssueCommentReaction, TIssueCommentReactionIdMap, TIssueCommentReactionMap } from "@plane/types";

export interface IIssueCommentReactionStoreActions {
  // actions
  fetchCommentReactions: (
    workspaceSlug: string,
    projectId: string,
    commentId: string
  ) => Promise<TIssueCommentReaction[]>;
  createCommentReaction: (
    workspaceSlug: string,
    projectId: string,
    commentId: string,
    reaction: string
  ) => Promise<any>;
  removeCommentReaction: (
    workspaceSlug: string,
    projectId: string,
    commentId: string,
    reaction: string
  ) => Promise<any>;
}

export interface IIssueCommentReactionStore extends IIssueCommentReactionStoreActions {
  // observables
  commentReactions: TIssueCommentReactionIdMap;
  commentReactionMap: TIssueCommentReactionMap;
  // helper methods
  getCommentReactionsByCommentId: (commentId: string) => string[] | undefined;
  getCommentReactionById: (reactionId: string) => TIssueCommentReaction | undefined;
}

export class IssueCommentReactionStore implements IIssueCommentReactionStore {
  // observables
  commentReactions: TIssueCommentReactionIdMap = {};
  commentReactionMap: TIssueCommentReactionMap = {};
  // root store
  rootIssueDetailStore: IIssueDetail;
  // services
  issueReactionService;

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {
      // observables
      commentReactions: observable,
      commentReactionMap: observable,
      // actions
      fetchCommentReactions: action,
      createCommentReaction: action,
      removeCommentReaction: action,
    });
    // root store
    this.rootIssueDetailStore = rootStore;
    // services
    this.issueReactionService = new IssueReactionService();
  }

  // helper methods
  getCommentReactionsByCommentId = (commentId: string) => {
    if (!commentId) return undefined;
    return this.commentReactions[commentId] ?? undefined;
  };

  getCommentReactionById = (reactionId: string) => {
    if (!reactionId) return undefined;
    return this.commentReactionMap[reactionId] ?? undefined;
  };

  // actions
  fetchCommentReactions = async (workspaceSlug: string, projectId: string, commentId: string) => {
    try {
      const reactions = await this.issueReactionService.listIssueCommentReactions(workspaceSlug, projectId, commentId);

      const reactionIds = reactions.map((reaction) => reaction.id);
      runInAction(() => {
        set(this.commentReactions, commentId, reactionIds);
        reactions.forEach((reaction) => {
          set(this.commentReactionMap, reaction.id, reaction);
        });
      });

      return reactions;
    } catch (error) {
      throw error;
    }
  };

  createCommentReaction = async (workspaceSlug: string, projectId: string, commentId: string, reaction: string) => {
    try {
      const response = await this.issueReactionService.createIssueCommentReaction(workspaceSlug, projectId, commentId, {
        reaction,
      });

      runInAction(() => {
        this.commentReactions[commentId].push(response.id);
        set(this.commentReactionMap, response.id, response);
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  removeCommentReaction = async (workspaceSlug: string, projectId: string, commentId: string, reaction: string) => {
    try {
      const reactionIndex = this.commentReactions[commentId].findIndex((_reaction) => _reaction === reaction);
      if (reactionIndex >= 0)
        runInAction(() => {
          this.commentReactions[commentId].splice(reactionIndex, 1);
          delete this.commentReactionMap[reaction];
        });

      const response = await this.issueReactionService.deleteIssueCommentReaction(
        workspaceSlug,
        projectId,
        commentId,
        reaction
      );

      return response;
    } catch (error) {
      this.fetchCommentReactions(workspaceSlug, projectId, commentId);
      throw error;
    }
  };
}

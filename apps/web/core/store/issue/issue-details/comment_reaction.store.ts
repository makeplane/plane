import { pull, find, concat, update, set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
// Plane Imports
import type { TIssueCommentReaction, TIssueCommentReactionIdMap, TIssueCommentReactionMap } from "@plane/types";
import { groupReactions } from "@plane/utils";
// services
import { IssueReactionService } from "@/services/issue";
// types
import type { IIssueDetail } from "./root.store";

export interface IIssueCommentReactionStoreActions {
  // actions
  fetchCommentReactions: (
    workspaceSlug: string,
    projectId: string,
    commentId: string
  ) => Promise<TIssueCommentReaction[]>;
  applyCommentReactions: (commentId: string, commentReactions: TIssueCommentReaction[]) => void;
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
    reaction: string,
    userId: string
  ) => Promise<any>;
}

export interface IIssueCommentReactionStore extends IIssueCommentReactionStoreActions {
  // observables
  commentReactions: TIssueCommentReactionIdMap;
  commentReactionMap: TIssueCommentReactionMap;
  // helper methods
  getCommentReactionsByCommentId: (commentId: string) => { [reaction_id: string]: string[] } | undefined;
  getCommentReactionById: (reactionId: string) => TIssueCommentReaction | undefined;
  commentReactionsByUser: (commentId: string, userId: string) => TIssueCommentReaction[];
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
      applyCommentReactions: action,
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

  commentReactionsByUser = (commentId: string, userId: string) => {
    if (!commentId || !userId) return [];

    const reactions = this.getCommentReactionsByCommentId(commentId);
    if (!reactions) return [];

    const _userReactions: TIssueCommentReaction[] = [];
    Object.keys(reactions).forEach((reaction) => {
      if (reactions?.[reaction])
        reactions?.[reaction].map((reactionId) => {
          const currentReaction = this.getCommentReactionById(reactionId);
          if (currentReaction && currentReaction.actor === userId) _userReactions.push(currentReaction);
        });
    });

    return _userReactions;
  };

  // actions
  fetchCommentReactions = async (workspaceSlug: string, projectId: string, commentId: string) => {
    try {
      const response = await this.issueReactionService.listIssueCommentReactions(workspaceSlug, projectId, commentId);

      const groupedReactions = groupReactions(response || [], "reaction");

      const commentReactionIdsMap: { [reaction: string]: string[] } = {};

      Object.keys(groupedReactions).map((reactionId) => {
        const reactionIds = (groupedReactions[reactionId] || []).map((reaction) => reaction.id);
        commentReactionIdsMap[reactionId] = reactionIds;
      });

      runInAction(() => {
        set(this.commentReactions, commentId, commentReactionIdsMap);
        response.forEach((reaction) => set(this.commentReactionMap, reaction.id, reaction));
      });

      return response;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  };

  applyCommentReactions = (commentId: string, commentReactions: TIssueCommentReaction[]) => {
    const groupedReactions = groupReactions(commentReactions || [], "reaction");

    const commentReactionIdsMap: { [reaction: string]: string[] } = {};

    Object.keys(groupedReactions).map((reactionId) => {
      const reactionIds = (groupedReactions[reactionId] || []).map((reaction) => reaction.id);
      commentReactionIdsMap[reactionId] = reactionIds;
    });

    runInAction(() => {
      set(this.commentReactions, commentId, commentReactionIdsMap);
      commentReactions.forEach((reaction) => set(this.commentReactionMap, reaction.id, reaction));
    });

    return;
  };

  createCommentReaction = async (workspaceSlug: string, projectId: string, commentId: string, reaction: string) => {
    try {
      const response = await this.issueReactionService.createIssueCommentReaction(workspaceSlug, projectId, commentId, {
        reaction,
      });

      if (!this.commentReactions[commentId]) this.commentReactions[commentId] = {};
      runInAction(() => {
        update(this.commentReactions, `${commentId}.${reaction}`, (reactionId) => {
          if (!reactionId) return [response.id];
          return concat(reactionId, response.id);
        });
        set(this.commentReactionMap, response.id, response);
      });

      return response;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  };

  removeCommentReaction = async (
    workspaceSlug: string,
    projectId: string,
    commentId: string,
    reaction: string,
    userId: string
  ) => {
    try {
      const userReactions = this.commentReactionsByUser(commentId, userId);
      const currentReaction = find(userReactions, { actor: userId, reaction: reaction });

      if (currentReaction && currentReaction.id) {
        runInAction(() => {
          pull(this.commentReactions[commentId][reaction], currentReaction.id);
          delete this.commentReactionMap[reaction];
        });
      }

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

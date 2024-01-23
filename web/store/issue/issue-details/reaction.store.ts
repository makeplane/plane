import { action, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
import update from "lodash/update";
import concat from "lodash/concat";
import find from "lodash/find";
import pull from "lodash/pull";
// services
import { IssueReactionService } from "services/issue";
// types
import { IIssueDetail } from "./root.store";
import { TIssueReaction, TIssueReactionMap, TIssueReactionIdMap } from "@plane/types";
// helpers
import { groupReactions } from "helpers/emoji.helper";

export interface IIssueReactionStoreActions {
  // actions
  fetchReactions: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueReaction[]>;
  createReaction: (workspaceSlug: string, projectId: string, issueId: string, reaction: string) => Promise<any>;
  removeReaction: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    reaction: string,
    userId: string
  ) => Promise<any>;
}

export interface IIssueReactionStore extends IIssueReactionStoreActions {
  // observables
  reactions: TIssueReactionIdMap;
  reactionMap: TIssueReactionMap;
  // helper methods
  getReactionsByIssueId: (issueId: string) => { [reaction_id: string]: string[] } | undefined;
  getReactionById: (reactionId: string) => TIssueReaction | undefined;
  reactionsByUser: (issueId: string, userId: string) => TIssueReaction[];
}

export class IssueReactionStore implements IIssueReactionStore {
  // observables
  reactions: TIssueReactionIdMap = {};
  reactionMap: TIssueReactionMap = {};
  // root store
  rootIssueDetailStore: IIssueDetail;
  // services
  issueReactionService;

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {
      // observables
      reactions: observable,
      reactionMap: observable,
      // actions
      fetchReactions: action,
      createReaction: action,
      removeReaction: action,
    });
    // root store
    this.rootIssueDetailStore = rootStore;
    // services
    this.issueReactionService = new IssueReactionService();
  }

  // helper methods
  getReactionsByIssueId = (issueId: string) => {
    if (!issueId) return undefined;
    return this.reactions[issueId] ?? undefined;
  };

  getReactionById = (reactionId: string) => {
    if (!reactionId) return undefined;
    return this.reactionMap[reactionId] ?? undefined;
  };

  reactionsByUser = (issueId: string, userId: string) => {
    if (!issueId || !userId) return [];

    const reactions = this.getReactionsByIssueId(issueId);
    if (!reactions) return [];

    const _userReactions: TIssueReaction[] = [];
    Object.keys(reactions).forEach((reaction) => {
      if (reactions?.[reaction])
        reactions?.[reaction].map((reactionId) => {
          const currentReaction = this.getReactionById(reactionId);
          if (currentReaction && currentReaction.actor === userId) _userReactions.push(currentReaction);
        });
    });

    return _userReactions;
  };

  // actions
  fetchReactions = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const response = await this.issueReactionService.listIssueReactions(workspaceSlug, projectId, issueId);
      const groupedReactions = groupReactions(response || [], "reaction");

      const issueReactionIdsMap: { [reaction: string]: string[] } = {};

      Object.keys(groupedReactions).map((reactionId) => {
        const reactionIds = (groupedReactions[reactionId] || []).map((reaction) => reaction.id);
        issueReactionIdsMap[reactionId] = reactionIds;
      });

      runInAction(() => {
        set(this.reactions, issueId, issueReactionIdsMap);
        response.forEach((reaction) => set(this.reactionMap, reaction.id, reaction));
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  createReaction = async (workspaceSlug: string, projectId: string, issueId: string, reaction: string) => {
    try {
      const response = await this.issueReactionService.createIssueReaction(workspaceSlug, projectId, issueId, {
        reaction,
      });

      runInAction(() => {
        update(this.reactions, [issueId, reaction], (reactionId) => {
          if (!reactionId) return [response.id];
          return concat(reactionId, response.id);
        });
        set(this.reactionMap, response.id, response);
      });

      // fetching activity
      this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
      return response;
    } catch (error) {
      throw error;
    }
  };

  removeReaction = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    reaction: string,
    userId: string
  ) => {
    try {
      const userReactions = this.reactionsByUser(issueId, userId);
      const currentReaction = find(userReactions, { actor: userId, reaction: reaction });

      if (currentReaction && currentReaction.id) {
        runInAction(() => {
          pull(this.reactions[issueId][reaction], currentReaction.id);
          delete this.reactionMap[reaction];
        });
      }

      const response = await this.issueReactionService.deleteIssueReaction(workspaceSlug, projectId, issueId, reaction);

      // fetching activity
      this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
      return response;
    } catch (error) {
      throw error;
    }
  };
}

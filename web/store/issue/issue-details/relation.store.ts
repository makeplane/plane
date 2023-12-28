import { action, computed, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// services
import { IssueReactionService } from "services/issue";
// types
import { IIssueDetail } from "./root.store";
import { TIssueReaction, TIssueReactionMap, TIssueReactionIdMap, TIssueRelationTypes } from "types";

export interface IIssueRelationStoreActions {
  // actions
  fetchRelations: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueReaction[]>;
  createRelation: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    relationType: TIssueRelationTypes,
    reaction: string
  ) => Promise<any>;
  removeRelation: (workspaceSlug: string, projectId: string, issueId: string, reaction: string) => Promise<any>;
}

export interface IIssueRelationStore extends IIssueRelationStoreActions {
  // observables
  reactions: TIssueReactionIdMap; // Record defines issueId as key and reactionId's as value
  reactionMap: TIssueReactionMap; // Record defines reactionId as key and reactions as value
  // computed
  issueReactions: string[] | undefined;
  // helper methods
  getReactionsByIssueId: (issueId: string) => string[] | undefined;
  getReactionById: (reactionId: string) => TIssueReaction | undefined;
}

export class IssueRelationStore implements IIssueRelationStore {
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
      // computed
      issueReactions: computed,
      // actions
      fetchRelations: action,
      createRelation: action,
      removeRelation: action,
    });
    // root store
    this.rootIssueDetailStore = rootStore;
    // services
    this.issueReactionService = new IssueReactionService();
  }

  // computed
  get issueReactions() {
    const issueId = this.rootIssueDetailStore.issueId;
    if (!issueId) return undefined;
    return this.reactions[issueId] ?? undefined;
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

  // actions
  fetchRelations = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const response = await this.issueReactionService.listIssueReactions(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.reactions[issueId] = response.map((reaction) => reaction.id);
        response.forEach((reaction) => set(this.reactionMap, reaction.id, reaction));
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  createRelation = async (workspaceSlug: string, projectId: string, issueId: string, reaction: string) => {
    try {
      const response = await this.issueReactionService.createIssueReaction(workspaceSlug, projectId, issueId, {
        reaction,
      });

      runInAction(() => {
        this.reactions[issueId].push(response.id);
        set(this.reactionMap, response.id, response);
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  removeRelation = async (workspaceSlug: string, projectId: string, issueId: string, reaction: string) => {
    try {
      const reactionIndex = this.reactions[issueId].findIndex((_reaction) => _reaction === reaction);
      if (reactionIndex >= 0)
        runInAction(() => {
          this.reactions[issueId].splice(reactionIndex, 1);
          delete this.reactionMap[reaction];
        });

      const response = await this.issueReactionService.deleteIssueReaction(workspaceSlug, projectId, issueId, reaction);

      return response;
    } catch (error) {
      // TODO: Replace with fetch issue details
      // this.fetchRelations(workspaceSlug, projectId, issueId);
      throw error;
    }
  };
}

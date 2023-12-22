import { action, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// services
import { IssueReactionService } from "services/issue";
// types
import { IIssueDetail } from "./root.store";
import { IIssueReaction } from "types";

export interface IIssueReactionStoreActions {
  // actions
  createReaction: (workspaceSlug: string, projectId: string, issueId: string, reaction: string) => Promise<any>;
  removeReaction: (workspaceSlug: string, projectId: string, issueId: string, reaction: string) => Promise<any>;
}

export interface IIssueReactionStore extends IIssueReactionStoreActions {
  // observables
  reactions: Record<string, string[]>; // Record defines issueId as key and reactionId's as value
  reactionMap: Record<string, IIssueReaction>; // Record defines reactionId as key and reactions as value
  // helper methods
  getReactionsByIssueId: (issueId: string) => string[] | undefined;
  getReactionById: (reactionId: string) => IIssueReaction | undefined;
}

export class IssueReactionStore implements IIssueReactionStore {
  // observables
  reactions: Record<string, string[]> = {};
  reactionMap: Record<string, IIssueReaction> = {};
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

  // actions
  createReaction = async (workspaceSlug: string, projectId: string, issueId: string, reaction: string) => {
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

  removeReaction = async (workspaceSlug: string, projectId: string, issueId: string, reaction: string) => {
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
      // this.fetchReactions(workspaceSlug, projectId, issueId);
      throw error;
    }
  };
}

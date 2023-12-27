import { makeObservable, runInAction } from "mobx";
import set from "lodash/set";
// services
import { IssueService } from "services/issue";
// types
import { IIssueDetail } from "./root.store";
import { TIssue } from "types";

export interface IIssueStoreActions {
  // actions
  fetchIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssue>;
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<TIssue>;
  removeIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssue>;
  addIssueToCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => Promise<TIssue>;
  removeIssueFromCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => Promise<TIssue>;
  addIssueToModule: (workspaceSlug: string, projectId: string, moduleId: string, issueIds: string[]) => Promise<any>;
  removeIssueFromModule: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueId: string
  ) => Promise<TIssue>;
}

export interface IIssueStore extends IIssueStoreActions {
  // helper methods
  getIssueById: (issueId: string) => TIssue | undefined;
}

export class IssueStore implements IIssueStore {
  // root store
  rootIssueDetail: IIssueDetail;
  // services
  issueService;

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {});
    // root store
    this.rootIssueDetail = rootStore;
    // services
    this.issueService = new IssueService();
  }

  // helper methods
  getIssueById = (issueId: string) => {
    if (!issueId) return undefined;
    return this.rootIssueDetail.rootIssueStore.issues.getIssueById(issueId) ?? undefined;
  };

  // actions
  fetchIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const issue = await this.issueService.retrieve(workspaceSlug, projectId, issueId);
      this.rootIssueDetail.rootIssueStore.issues.updateIssue(issue.id, issue);

      // issue reactions
      const issueReactions = issue?.issue_reactions;
      if (issueReactions && issueReactions.length > 0) {
        const issueReactionIds = issueReactions.map((reaction: any) => reaction.id);
        runInAction(() => {
          set(this.rootIssueDetail.reaction.reactions, issue.id, issueReactionIds);
          issueReactions?.forEach((reaction: any) => {
            set(this.rootIssueDetail.reaction.reactionMap, reaction.id, reaction);
          });
        });
      }

      // fetch issue links
      const issueLinks = issue?.issue_link;
      if (issueLinks && issueLinks.length > 0) {
        const issueLinkIds = issueLinks.map((reaction: any) => reaction.id);
        runInAction(() => {
          set(this.rootIssueDetail.link.links, issue.id, issueLinkIds);
          issueLinks?.forEach((link: any) => {
            set(this.rootIssueDetail.link.linkMap, link.id, link);
          });
        });
      }

      // fetch issue activity
      this.rootIssueDetail.activity.fetchActivities(workspaceSlug, projectId, issueId);

      // fetch issue subscription
      this.rootIssueDetail.subscription.fetchSubscriptions(workspaceSlug, projectId, issueId);

      return issue;
    } catch (error) {
      throw error;
    }
  };

  updateIssue = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) =>
    this.rootIssueDetail.rootIssueStore.projectIssues.updateIssue(workspaceSlug, projectId, issueId, data);

  removeIssue = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.rootIssueDetail.rootIssueStore.projectIssues.removeIssue(workspaceSlug, projectId, issueId);

  addIssueToCycle = async (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) =>
    this.rootIssueDetail.rootIssueStore.cycleIssues.addIssueToCycle(workspaceSlug, projectId, cycleId, issueIds);

  removeIssueFromCycle = async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) =>
    this.rootIssueDetail.rootIssueStore.cycleIssues.removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueId);

  addIssueToModule = async (workspaceSlug: string, projectId: string, moduleId: string, issueIds: string[]) =>
    this.rootIssueDetail.rootIssueStore.moduleIssues.addIssueToModule(workspaceSlug, projectId, moduleId, issueIds);

  removeIssueFromModule = async (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) =>
    this.rootIssueDetail.rootIssueStore.moduleIssues.removeIssueFromModule(workspaceSlug, projectId, moduleId, issueId);
}

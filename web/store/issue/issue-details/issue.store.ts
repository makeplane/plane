import { makeObservable } from "mobx";
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
      if (!issue) throw new Error("Issue not found");

      this.rootIssueDetail.rootIssueStore.issues.addIssue([issue]);

      // issue reactions
      this.rootIssueDetail.reaction.fetchReactions(workspaceSlug, projectId, issueId);

      // fetch issue links
      this.rootIssueDetail.link.fetchLinks(workspaceSlug, projectId, issueId);

      // fetch issue attachments
      this.rootIssueDetail.attachment.fetchAttachments(workspaceSlug, projectId, issueId);

      // fetch issue relations

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

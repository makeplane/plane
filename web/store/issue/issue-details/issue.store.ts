import { makeObservable } from "mobx";
// services
import { IssueService } from "services/issue";
// types
import { IIssueDetail } from "./root.store";
import { TIssue } from "@plane/types";

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
  rootIssueDetailStore: IIssueDetail;
  // services
  issueService;

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {});
    // root store
    this.rootIssueDetailStore = rootStore;
    // services
    this.issueService = new IssueService();
  }

  // helper methods
  getIssueById = (issueId: string) => {
    if (!issueId) return undefined;
    return this.rootIssueDetailStore.rootIssueStore.issues.getIssueById(issueId) ?? undefined;
  };

  // actions
  fetchIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const query = {
        expand: "state,assignees,labels,parent",
      };
      const issue = (await this.issueService.retrieve(workspaceSlug, projectId, issueId, query)) as any;
      if (!issue) throw new Error("Issue not found");

      this.rootIssueDetailStore.rootIssueStore.issues.addIssue([issue]);

      // store handlers from issue detail
      // parent
      if (issue && issue?.parent && issue?.parent?.id)
        this.rootIssueDetailStore.rootIssueStore.issues.addIssue([issue?.parent]);
      // assignees
      // labels
      // state

      // issue reactions
      this.rootIssueDetailStore.reaction.fetchReactions(workspaceSlug, projectId, issueId);

      // fetch issue links
      this.rootIssueDetailStore.link.fetchLinks(workspaceSlug, projectId, issueId);

      // fetch issue attachments
      this.rootIssueDetailStore.attachment.fetchAttachments(workspaceSlug, projectId, issueId);

      // fetch issue activity
      this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);

      // fetch issue subscription
      this.rootIssueDetailStore.subscription.fetchSubscriptions(workspaceSlug, projectId, issueId);

      // fetch sub issues
      this.rootIssueDetailStore.subIssues.fetchSubIssues(workspaceSlug, projectId, issueId);

      // fetch issue relations
      this.rootIssueDetailStore.relation.fetchRelations(workspaceSlug, projectId, issueId);

      return issue;
    } catch (error) {
      throw error;
    }
  };

  updateIssue = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) =>
    this.rootIssueDetailStore.rootIssueStore.projectIssues.updateIssue(workspaceSlug, projectId, issueId, data);

  removeIssue = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.rootIssueDetailStore.rootIssueStore.projectIssues.removeIssue(workspaceSlug, projectId, issueId);

  addIssueToCycle = async (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) =>
    this.rootIssueDetailStore.rootIssueStore.cycleIssues.addIssueToCycle(workspaceSlug, projectId, cycleId, issueIds);

  removeIssueFromCycle = async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) =>
    this.rootIssueDetailStore.rootIssueStore.cycleIssues.removeIssueFromCycle(
      workspaceSlug,
      projectId,
      cycleId,
      issueId
    );

  addIssueToModule = async (workspaceSlug: string, projectId: string, moduleId: string, issueIds: string[]) =>
    this.rootIssueDetailStore.rootIssueStore.moduleIssues.addIssueToModule(
      workspaceSlug,
      projectId,
      moduleId,
      issueIds
    );

  removeIssueFromModule = async (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) =>
    this.rootIssueDetailStore.rootIssueStore.moduleIssues.removeIssueFromModule(
      workspaceSlug,
      projectId,
      moduleId,
      issueId
    );
}

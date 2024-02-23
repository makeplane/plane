import { makeObservable } from "mobx";
// services
import { IssueArchiveService, IssueService } from "services/issue";
// types
import { TIssue } from "@plane/types";
import { computedFn } from "mobx-utils";
import { IIssueDetail } from "./root.store";

export interface IIssueStoreActions {
  // actions
  fetchIssue: (workspaceSlug: string, projectId: string, issueId: string, isArchived?: boolean) => Promise<TIssue>;
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  removeIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  addIssueToCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => Promise<void>;
  removeIssueFromCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => Promise<TIssue>;
  addModulesToIssue: (workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) => Promise<any>;
  removeModulesFromIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    moduleIds: string[]
  ) => Promise<void>;
  removeIssueFromModule: (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) => Promise<void>;
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
  issueArchiveService;

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {});
    // root store
    this.rootIssueDetailStore = rootStore;
    // services
    this.issueService = new IssueService();
    this.issueArchiveService = new IssueArchiveService();
  }

  // helper methods
  getIssueById = computedFn((issueId: string) => {
    if (!issueId) return undefined;
    return this.rootIssueDetailStore.rootIssueStore.issues.getIssueById(issueId) ?? undefined;
  });

  // actions
  fetchIssue = async (workspaceSlug: string, projectId: string, issueId: string, isArchived = false) => {
    try {
      const query = {
        expand: "issue_reactions,issue_attachment,issue_link,parent",
      };

      let issue: TIssue;

      if (isArchived)
        issue = await this.issueArchiveService.retrieveArchivedIssue(workspaceSlug, projectId, issueId, query);
      else issue = await this.issueService.retrieve(workspaceSlug, projectId, issueId, query);

      if (!issue) throw new Error("Issue not found");

      this.rootIssueDetailStore.rootIssueStore.issues.addIssue([issue], true);

      // store handlers from issue detail
      // parent
      if (issue && issue?.parent && issue?.parent?.id)
        this.rootIssueDetailStore.rootIssueStore.issues.addIssue([issue.parent]);
      // assignees
      // labels
      // state

      // issue reactions
      if (issue.issue_reactions) this.rootIssueDetailStore.addReactions(issueId, issue.issue_reactions);

      // fetch issue links
      if (issue.issue_link) this.rootIssueDetailStore.addLinks(issueId, issue.issue_link);

      // fetch issue attachments
      if (issue.issue_attachment) this.rootIssueDetailStore.addAttachments(issueId, issue.issue_attachment);

      this.rootIssueDetailStore.addSubscription(issueId, issue.is_subscribed);

      // fetch issue activity
      this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);

      // fetch issue comments
      this.rootIssueDetailStore.comment.fetchComments(workspaceSlug, projectId, issueId);

      // fetch sub issues
      this.rootIssueDetailStore.subIssues.fetchSubIssues(workspaceSlug, projectId, issueId);

      // fetch issue relations
      this.rootIssueDetailStore.relation.fetchRelations(workspaceSlug, projectId, issueId);

      // fetching states
      // TODO: check if this function is required
      this.rootIssueDetailStore.rootIssueStore.state.fetchProjectStates(workspaceSlug, projectId);

      return issue;
    } catch (error) {
      throw error;
    }
  };

  updateIssue = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
    await this.rootIssueDetailStore.rootIssueStore.projectIssues.updateIssue(workspaceSlug, projectId, issueId, data);
    await this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
  };

  removeIssue = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.rootIssueDetailStore.rootIssueStore.projectIssues.removeIssue(workspaceSlug, projectId, issueId);

  addIssueToCycle = async (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => {
    await this.rootIssueDetailStore.rootIssueStore.cycleIssues.addIssueToCycle(
      workspaceSlug,
      projectId,
      cycleId,
      issueIds,
      false
    );
    if (issueIds && issueIds.length > 0)
      await this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueIds[0]);
  };

  removeIssueFromCycle = async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {
    const cycle = await this.rootIssueDetailStore.rootIssueStore.cycleIssues.removeIssueFromCycle(
      workspaceSlug,
      projectId,
      cycleId,
      issueId
    );
    await this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return cycle;
  };

  addModulesToIssue = async (workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) => {
    const _module = await this.rootIssueDetailStore.rootIssueStore.moduleIssues.addModulesToIssue(
      workspaceSlug,
      projectId,
      issueId,
      moduleIds
    );
    if (moduleIds && moduleIds.length > 0)
      await this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return _module;
  };

  removeModulesFromIssue = async (workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) => {
    const _module = await this.rootIssueDetailStore.rootIssueStore.moduleIssues.removeModulesFromIssue(
      workspaceSlug,
      projectId,
      issueId,
      moduleIds
    );
    await this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return _module;
  };

  removeIssueFromModule = async (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) => {
    const _module = await this.rootIssueDetailStore.rootIssueStore.moduleIssues.removeIssueFromModule(
      workspaceSlug,
      projectId,
      moduleId,
      issueId
    );
    await this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return _module;
  };
}

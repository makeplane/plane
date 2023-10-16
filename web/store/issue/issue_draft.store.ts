// mobx
import { action, observable, runInAction, makeAutoObservable } from "mobx";
// services
import { IssueDraftService } from "services/issue";
// types
import type { IIssue, IUser } from "types";

export class DraftIssuesStore {
  issues: { [key: string]: IIssue } = {};
  isIssuesLoading: boolean = false;
  rootStore: any | null = null;
  issueDraftService;

  constructor(_rootStore: any | null = null) {
    makeAutoObservable(this, {
      issues: observable.ref,
      isIssuesLoading: observable.ref,
      rootStore: observable.ref,
      loadDraftIssues: action,
      getIssueById: action,
      createDraftIssue: action,
      updateDraftIssue: action,
      deleteDraftIssue: action,
    });

    this.rootStore = _rootStore;
    this.issueDraftService = new IssueDraftService();
  }

  /**
   * @description Fetch all draft issues of a project and hydrate issues field
   */

  loadDraftIssues = async (workspaceSlug: string, projectId: string, params?: any) => {
    this.isIssuesLoading = true;
    try {
      const issuesResponse = await this.issueDraftService.getDraftIssues(workspaceSlug, projectId, params);

      const issues = Array.isArray(issuesResponse) ? { allIssues: issuesResponse } : issuesResponse;

      runInAction(() => {
        this.issues = issues;
        this.isIssuesLoading = false;
      });
    } catch (error) {
      this.isIssuesLoading = false;
      console.error("Fetching issues error", error);
    }
  };

  /**
   * @description Fetch a single draft issue by id and hydrate issues field
   * @param workspaceSlug
   * @param projectId
   * @param issueId
   * @returns {IIssue}
   */

  getIssueById = async (workspaceSlug: string, projectId: string, issueId: string): Promise<IIssue> => {
    if (this.issues[issueId]) return this.issues[issueId];

    try {
      const issueResponse: IIssue = await this.issueDraftService.getDraftIssueById(workspaceSlug, projectId, issueId);

      const issues = {
        ...this.issues,
        [issueId]: { ...issueResponse },
      };

      runInAction(() => {
        this.issues = issues;
      });

      return issueResponse;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description Create a new draft issue and hydrate issues field
   * @param workspaceSlug
   * @param projectId
   * @param issueForm
   * @param user
   * @returns {IIssue}
   */

  createDraftIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueForm: IIssue,
    user: IUser
  ): Promise<IIssue> => {
    try {
      const issueResponse = await this.issueDraftService.createDraftIssue(workspaceSlug, projectId, issueForm);

      const issues = {
        ...this.issues,
        [issueResponse.id]: { ...issueResponse },
      };

      runInAction(() => {
        this.issues = issues;
      });
      return issueResponse;
    } catch (error) {
      console.error("Creating issue error", error);
      throw error;
    }
  };

  updateDraftIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    issueForm: Partial<IIssue>,
    user: IUser
  ) => {
    // keep a copy of the issue in the store
    const originalIssue = { ...this.issues[issueId] };

    // immediately update the issue in the store
    const updatedIssue = { ...this.issues[issueId], ...issueForm };
    if (updatedIssue.assignees_list) updatedIssue.assignees = updatedIssue.assignees_list;

    try {
      runInAction(() => {
        this.issues[issueId] = { ...updatedIssue };
      });

      // make a patch request to update the issue
      const issueResponse: IIssue = await this.issueDraftService.updateDraftIssue(
        workspaceSlug,
        projectId,
        issueId,
        issueForm
      );

      const updatedIssues = { ...this.issues };
      updatedIssues[issueId] = { ...issueResponse };

      runInAction(() => {
        this.issues = updatedIssues;
      });
    } catch (error) {
      // if there is an error, revert the changes
      runInAction(() => {
        this.issues[issueId] = originalIssue;
      });

      return error;
    }
  };

  deleteDraftIssue = async (workspaceSlug: string, projectId: string, issueId: string, user: IUser) => {
    const issues = { ...this.issues };
    delete issues[issueId];

    try {
      runInAction(() => {
        this.issues = issues;
      });

      this.issueDraftService.deleteDraftIssue(workspaceSlug, projectId, issueId);
    } catch (error) {
      console.error("Deleting issue error", error);
    }
  };
}

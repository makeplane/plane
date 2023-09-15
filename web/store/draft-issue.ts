// mobx
import { action, observable, runInAction, makeAutoObservable } from "mobx";
// services
import issueService from "services/issues.service";
// types
import type { ICurrentUserResponse, IIssue } from "types";

class DraftIssuesStore {
  issues: { [key: string]: IIssue } = {};
  isIssuesLoading: boolean = false;
  rootStore: any | null = null;

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
  }

  /**
   * @description Fetch all draft issues of a project and hydrate issues field
   */

  loadDraftIssues = async (workspaceSlug: string, projectId: string, params?: any) => {
    this.isIssuesLoading = true;
    try {
      const issuesResponse = await issueService.getDraftIssues(workspaceSlug, projectId, params);

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

  getIssueById = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<IIssue> => {
    if (this.issues[issueId]) return this.issues[issueId];

    try {
      const issueResponse: IIssue = await issueService.getDraftIssueById(
        workspaceSlug,
        projectId,
        issueId
      );

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
    user: ICurrentUserResponse
  ): Promise<IIssue> => {
    try {
      const issueResponse = await issueService.createDraftIssue(
        workspaceSlug,
        projectId,
        issueForm,
        user
      );

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
    user: ICurrentUserResponse
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
      const issueResponse: IIssue = await issueService.updateDraftIssue(
        workspaceSlug,
        projectId,
        issueId,
        issueForm,
        user
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

  deleteDraftIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    user: ICurrentUserResponse
  ) => {
    const issues = { ...this.issues };
    delete issues[issueId];

    try {
      runInAction(() => {
        this.issues = issues;
      });

      issueService.deleteDraftIssue(workspaceSlug, projectId, issueId, user);
    } catch (error) {
      console.error("Deleting issue error", error);
    }
  };
}

export default DraftIssuesStore;

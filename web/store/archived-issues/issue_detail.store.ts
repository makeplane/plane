import { observable, action, makeObservable, runInAction } from "mobx";
// store
import { RootStore } from "../root";
// types
import { IIssue } from "types";
// services
import { IssueArchiveService } from "services/issue";

export interface IArchivedIssueDetailStore {
  loader: boolean;
  error: any | null;
  // issues
  issueDetail: {
    [project_id: string]: {
      [issue_id: string]: IIssue;
    };
  };

  // services
  archivedIssueService: IssueArchiveService;

  // action
  deleteArchivedIssue: (workspaceSlug: string, projectId: string, issuesId: string) => Promise<any>;
  unarchiveIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<any>;
  fetchIssueDetails: (workspaceSlug: string, projectId: string, issueId: string) => Promise<any>;
}

export class ArchivedIssueDetailStore implements IArchivedIssueDetailStore {
  loader: boolean = false;
  error: any | null = null;
  issueDetail: IArchivedIssueDetailStore["issueDetail"] = {};

  // service
  archivedIssueService;
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      error: observable.ref,
      issueDetail: observable.ref,

      // actions
      deleteArchivedIssue: action,
      unarchiveIssue: action,
      fetchIssueDetails: action,
    });
    this.rootStore = _rootStore;
    this.archivedIssueService = new IssueArchiveService();
  }

  /**
   * @description Function to delete archived issue from the detail store and backend.
   */
  deleteArchivedIssue = async (workspaceSlug: string, projectId: string, issuesId: string) => {
    const originalIssues = { ...this.issueDetail[projectId] };

    const _issues = { ...this.issueDetail[projectId] };
    delete _issues[issuesId];

    // optimistically deleting item from store
    runInAction(() => {
      this.issueDetail = {
        ...this.issueDetail,
        [projectId]: _issues,
      };
    });

    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      // deleting using api
      const issueResponse = await this.archivedIssueService.deleteArchivedIssue(workspaceSlug, projectId, issuesId);

      runInAction(() => {
        this.loader = false;
        this.error = null;
      });

      return issueResponse;
    } catch (error) {
      console.error("Error: Fetching error in issues", error);
      runInAction(() => {
        this.loader = false;
        this.error = error;
        // reverting back to original issues
        this.issueDetail = {
          ...this.issueDetail,
          [projectId]: originalIssues,
        };
      });
      throw error;
    }
  };

  fetchIssueDetails = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const issueResponse = await this.archivedIssueService.retrieveArchivedIssue(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.loader = false;
        this.error = null;
        this.issueDetail = {
          ...this.issueDetail,
          [projectId]: {
            ...this.issueDetail[projectId],
            [issueId]: issueResponse,
          },
        };
      });

      return issueResponse;
    } catch (error) {
      console.error("Error: Fetching error in issues", error);
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });
      throw error;
    }
  };

  unarchiveIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const issueResponse = await this.archivedIssueService.unarchiveIssue(workspaceSlug, projectId, issueId);
      this.rootStore.archivedIssues.fetchIssues(workspaceSlug, projectId);

      // deleting from issue detail store
      const _issues = { ...this.issueDetail[projectId] };
      delete _issues[issueId];
      runInAction(() => {
        this.issueDetail = {
          ...this.issueDetail,
          [projectId]: _issues,
        };
      });

      return issueResponse;
    } catch (error) {
      console.error("Error: Fetching error in issues", error);
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });
      throw error;
    }
  };
}

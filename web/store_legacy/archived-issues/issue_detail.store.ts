import { observable, action, makeObservable, runInAction, computed } from "mobx";
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
    [issue_id: string]: IIssue;
  };
  peekId: string | null;

  // services
  archivedIssueService: IssueArchiveService;

  // computed
  getIssue: IIssue | null;

  // action
  deleteArchivedIssue: (workspaceSlug: string, projectId: string, issuesId: string) => Promise<any>;
  unarchiveIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<any>;
  fetchIssueDetails: (workspaceSlug: string, projectId: string, issueId: string) => Promise<any>;
  fetchPeekIssueDetails: (workspaceSlug: string, projectId: string, issueId: string) => Promise<any>;
}

export class ArchivedIssueDetailStore implements IArchivedIssueDetailStore {
  loader: boolean = false;
  error: any | null = null;
  issueDetail: IArchivedIssueDetailStore["issueDetail"] = {};
  peekId: string | null = null;

  // service
  archivedIssueService;
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      error: observable.ref,
      issueDetail: observable.ref,
      peekId: observable.ref,

      // computed
      getIssue: computed,

      // actions
      deleteArchivedIssue: action,
      unarchiveIssue: action,
      fetchIssueDetails: action,
      fetchPeekIssueDetails: action,
    });
    this.rootStore = _rootStore;
    this.archivedIssueService = new IssueArchiveService();
  }

  get getIssue() {
    if (!this.peekId) return null;
    const _issue = this.issueDetail[this.peekId];
    return _issue || null;
  }

  /**
   * @description Function to delete archived issue from the detail store and backend.
   */
  deleteArchivedIssue = async (workspaceSlug: string, projectId: string, issuesId: string) => {
    const originalIssues = { ...this.issueDetail };

    const _issues = { ...this.issueDetail };
    delete _issues[issuesId];

    // optimistically deleting item from store
    runInAction(() => {
      this.issueDetail = _issues;
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
        this.issueDetail = originalIssues;
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
          [issueId]: issueResponse,
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
      const _issues = { ...this.issueDetail };
      delete _issues[issueId];
      runInAction(() => {
        this.issueDetail = _issues;
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

  fetchPeekIssueDetails = async (workspaceSlug: string, projectId: string, issueId: string) => {
    runInAction(() => {
      this.loader = true;
      this.error = null;
      this.peekId = issueId;
    });

    try {
      const issueResponse = await this.archivedIssueService.retrieveArchivedIssue(workspaceSlug, projectId, issueId);
      await this.rootStore.issueDetail.fetchIssueReactions(workspaceSlug, projectId, issueId);
      await this.rootStore.issueDetail.fetchIssueActivity(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.loader = false;
        this.error = null;
        this.issueDetail = {
          ...this.issueDetail,
          [issueId]: issueResponse,
        };
      });

      return issueResponse;
    } catch (error) {
      console.error("Error: Fetching error in issues", error);
      runInAction(() => {
        this.loader = false;
        this.error = error;
        this.peekId = null;
      });
      throw error;
    }
  };
}

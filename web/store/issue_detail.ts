import { observable, action, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";
// services
import { IssueService } from "services/issue.service";
import { IIssue } from "types";

export type IPeekMode = "side" | "modal" | "full";

export interface IIssueDetailStore {
  loader: boolean;
  error: any | null;

  peekId: string | null;
  peekMode: IPeekMode | null;

  issues: {
    [key: string]: IIssue;
  };

  setPeekId: (issueId: string | null) => void;
  setPeekMode: (issueId: IPeekMode | null) => void;
  // fetch issue details
  fetchIssueDetails: (workspaceId: string, projectId: string, issueId: string) => void;
  // creating issue
  createIssue: (workspaceId: string, projectId: string, issueId: string, data: any) => void;
  // updating issue
  updateIssue: (workspaceId: string, projectId: string, issueId: string, data: any) => void;
  // deleting issue
  deleteIssue: (workspaceId: string, projectId: string, issueId: string) => void;
}

class IssueDetailStore implements IIssueDetailStore {
  loader: boolean = false;
  error: any | null = null;

  peekId: string | null = null;
  peekMode: IPeekMode | null = null;

  issues: {
    [key: string]: IIssue;
  } = {};

  // root store
  rootStore;
  // service
  issueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      error: observable.ref,

      peekId: observable.ref,
      peekMode: observable.ref,

      issues: observable.ref,

      setPeekId: action,
      setPeekMode: action,

      fetchIssueDetails: action,
      createIssue: action,
      updateIssue: action,
      deleteIssue: action,
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueService();
  }

  setPeekId = (issueId: string | null) => (this.peekId = issueId);

  setPeekMode = (mode: IPeekMode | null) => (this.peekMode = mode);

  fetchIssueDetails = async (workspaceId: string, projectId: string, issueId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const issueDetailsResponse = await this.issueService.retrieve(workspaceId, projectId, issueId);

      runInAction(() => {
        this.loader = false;
        this.error = null;
        this.issues = {
          [issueId]: issueDetailsResponse,
        };
      });
    } catch (error) {
      console.log("error in fetching issue details", error);
      this.loader = false;
      this.error = error;
      return error;
    }
  };

  createIssue = async (workspaceId: string, projectId: string, issueId: string, data: any) => {
    try {
      this.loader = true;
      this.error = null;

      console.log("workspaceId", workspaceId);
      console.log("projectId", projectId);
      console.log("issueId", issueId);
      console.log("data", data);

      runInAction(() => {
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.log("error in fetching issue details", error);
      this.loader = false;
      this.error = error;
      return error;
    }
  };

  updateIssue = async (workspaceId: string, projectId: string, issueId: string, data: any) => {
    try {
      this.loader = true;
      this.error = null;

      const filteredParams = this.rootStore.issueFilter.getComputedFilters(
        workspaceId,
        projectId,
        null,
        null,
        null,
        this.rootStore.issueFilters.issueView || "issues"
      );
      const issueResponse = await this.issueService.patchIssue(workspaceId, projectId, issueId, data, undefined);
      const issueList = (await this.issueService.getIssuesWithParams(workspaceId, projectId, filteredParams)) as any;
      console.log("issueList", issueList);

      if (issueResponse) {
        runInAction(() => {
          this.loader = false;
          this.error = null;
          this.rootStore.issueView.issues[workspaceId].project_issues[projectId].issues.list = issueList;
        });
      }
    } catch (error) {
      console.log("error in fetching issue details", error);
      this.loader = false;
      this.error = error;
      return error;
    }
  };

  deleteIssue = async (workspaceId: string, projectId: string, issueId: string) => {
    try {
      this.loader = true;
      this.error = null;

      console.log("workspaceId", workspaceId);
      console.log("projectId", projectId);
      console.log("issueId", issueId);

      runInAction(() => {
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.log("error in fetching issue details", error);
      this.loader = false;
      this.error = error;
      return error;
    }
  };
}

export default IssueDetailStore;

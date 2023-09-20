import { observable, action, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";
// services
import { IssueServices } from "services/issue.service";

export type IPeekMode = "side" | "modal" | "full";

export interface IIssueViewDetailStore {
  loader: boolean;
  error: any | null;

  peekId: string | null;
  peekMode: IPeekMode | null;

  issue_detail: {
    workspace: {
      [key: string]: {
        issues: {
          [key: string]: any;
        };
      };
    };
  };

  setPeekId: (issueId: string | null) => void;
  setPeekMode: (issueId: IPeekMode | null) => void;

  // fetch issue details
  fetchIssueDetailsAsync: (workspaceId: string, projectId: string, issueId: string) => void;
  // creating issue
  createIssueAsync: (workspaceId: string, projectId: string, issueId: string, data: any) => void;
  // updating issue
  updateIssueAsync: (workspaceId: string, projectId: string, issueId: string, data: any) => void;
  // deleting issue
  deleteIssueAsync: (workspaceId: string, projectId: string, issueId: string) => void;
}

class IssueViewDetailStore implements IIssueViewDetailStore {
  loader: boolean = false;
  error: any | null = null;

  peekId: string | null = null;
  peekMode: IPeekMode | null = null;

  issue_detail: {
    workspace: {
      [key: string]: {
        issues: {
          [key: string]: any;
        };
      };
    };
  } = {
    workspace: {},
  };

  // root store
  rootStore;
  // service
  issueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable,
      error: observable,

      peekId: observable,
      peekMode: observable,
      issue_detail: observable,

      setPeekId: action,
      setPeekMode: action,

      fetchIssueDetailsAsync: action,
      createIssueAsync: action,
      updateIssueAsync: action,
      deleteIssueAsync: action,
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueServices();
  }

  setPeekId = (issueId: string | null) => (this.peekId = issueId);
  setPeekMode = (mode: IPeekMode | null) => (this.peekMode = mode);

  fetchIssueDetailsAsync = async (workspaceId: string, projectId: string, issueId: string) => {
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

  createIssueAsync = async (workspaceId: string, projectId: string, issueId: string, data: any) => {
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

  updateIssueAsync = async (workspaceId: string, projectId: string, issueId: string, data: any) => {
    try {
      this.loader = true;
      this.error = null;

      const filteredParams = this.rootStore.issueFilters.getComputedFilters(
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

  deleteIssueAsync = async (workspaceId: string, projectId: string, issueId: string) => {
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

export default IssueViewDetailStore;

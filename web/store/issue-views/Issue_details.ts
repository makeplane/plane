import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "../root";
// services
import { ProjectIssuesServices } from "services/issues.service";
// types
import { TIssueLayouts } from "./issue_filters";

export interface IIssueViewStore {
  loader: boolean;
  error: any | null;

  issues: { [key: string]: { [key: string]: any } } | null;

  getIssuesAsync: (
    workspaceId: string,
    projectId: string,
    view: TIssueLayouts | null
  ) => null | Promise<any>;
}

class IssueViewStore implements IIssueViewStore {
  loader: boolean = false;
  error: any | null = null;

  issues: { [key: string]: { [key: string]: any } } | null = null;

  // root store
  rootStore;
  // service
  issueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable,
      error: observable,

      issues: observable.ref,
      // action
      getIssuesAsync: action,
      // computed
    });

    this.rootStore = _rootStore;
    this.issueService = new ProjectIssuesServices();
  }

  // computed
  get getIssues() {
    if (
      this.rootStore.issueFilters.projectId &&
      this.issues != null &&
      this.rootStore.issueFilters.issueView != null
    )
      return this.issues[this.rootStore.issueFilters.projectId][
        this.rootStore.issueFilters.issueView
      ];
    else return null;
  }

  // handling kanBan drag and drop events

  // fetching issues
  getIssuesAsync = async (workspaceId: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const filteredParams = this.rootStore.issueFilters.getComputedFilters(
        workspaceId,
        projectId,
        "kanBan",
        "issues"
      );
      const issuesResponse = await this.issueService.getIssuesWithParams(
        workspaceId,
        projectId,
        filteredParams
      );

      if (issuesResponse) {
        runInAction(() => {
          this.issues = { ...this.issues, [projectId]: { issues: { ...issuesResponse } } };
          this.loader = false;
          this.error = null;
        });
      }

      return issuesResponse;
    } catch (error) {
      console.warn("error", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };

  // fetching issues for modules
  getIssuesForModulesAsync = async (workspaceId: string, projectId: string, moduleId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const filteredParams = this.rootStore.issueFilters.getComputedFilters(
        workspaceId,
        projectId,
        "kanBan",
        "modules"
      );
      const issuesResponse = await this.issueService.getIssuesWithParams(
        workspaceId,
        projectId,
        filteredParams
      );

      if (issuesResponse) {
        runInAction(() => {
          this.issues = { ...this.issues, [projectId]: { views: { ...issuesResponse } } };
          this.loader = false;
          this.error = null;
        });
      }

      return issuesResponse;
    } catch (error) {
      console.warn("error", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };

  // fetching issues for cycles
  getIssuesForModulesCycles = async (workspaceId: string, projectId: string, moduleId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const filteredParams = this.rootStore.issueFilters.getComputedFilters(
        workspaceId,
        projectId,
        "kanBan",
        "cycles"
      );
      const issuesResponse = await this.issueService.getIssuesWithParams(
        workspaceId,
        projectId,
        filteredParams
      );

      if (issuesResponse) {
        runInAction(() => {
          this.issues = { ...this.issues, [projectId]: { views: { ...issuesResponse } } };
          this.loader = false;
          this.error = null;
        });
      }

      return issuesResponse;
    } catch (error) {
      console.warn("error", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };

  // fetching issues for views
  getIssuesForViews = async (workspaceId: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const filteredParams = this.rootStore.issueFilters.getComputedFilters(
        workspaceId,
        projectId,
        "kanBan",
        "views"
      );
      const issuesResponse = await this.issueService.getIssuesWithParams(
        workspaceId,
        projectId,
        filteredParams
      );

      if (issuesResponse) {
        runInAction(() => {
          this.issues = { ...this.issues, [projectId]: { views: { ...issuesResponse } } };
          this.loader = false;
          this.error = null;
        });
      }

      return issuesResponse;
    } catch (error) {
      console.warn("error", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };
}

export default IssueViewStore;

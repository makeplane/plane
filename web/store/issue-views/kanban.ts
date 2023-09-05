import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "../root";
// services
import { ProjectIssuesServices } from "services/issues.service";
// types
import { TIssueViews } from "./filters";

export interface IKanbanStore {
  loader: boolean;
  error: any | null;
  issues: { [key: string]: any } | null;

  getIssuesAsync: (
    workspaceId: string,
    projectId: string,
    view: TIssueViews | null
  ) => null | Promise<any>;
}

class KanbanStore implements IKanbanStore {
  loader: boolean = false;
  error: any | null = null;

  issues: { [key: string]: any } | null = null;

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
    if (this.rootStore.issueFilters.projectId && this.issues != null)
      return this.issues[this.rootStore.issueFilters.projectId];
    else return null;
  }

  // fetching issues
  getIssuesAsync = async (workspaceId: string, projectId: string, view: TIssueViews | null) => {
    try {
      this.loader = true;
      this.error = null;

      const filteredParams = this.rootStore.issueFilters.getComputedFilters(
        workspaceId,
        projectId,
        view
      );
      const issuesResponse = await this.issueService.getIssuesWithParams(
        workspaceId,
        projectId,
        filteredParams
      );

      if (issuesResponse) {
        runInAction(() => {
          this.issues = { ...this.issues, [projectId]: { ...issuesResponse } };
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

  // handle issue drag and drop
}

export default KanbanStore;

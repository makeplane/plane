import { observable, action, makeObservable, runInAction } from "mobx";
// services
import { ProjectService } from "services/project.service";
import { WorkspaceService } from "services/workspace.service";
// types
import { RootStore } from "./root";
import { IIssue, IIssueFilterOptions } from "types";
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";

export interface IGlobalViewIssuesStore {
  // states
  loader: boolean;
  error: any | null;

  // observables
  viewIssues: {
    [viewId: string]: IIssue[];
  };

  // actions
  fetchViewIssues: (workspaceSlug: string, viewId: string, filters: IIssueFilterOptions) => Promise<any>;
}

class GlobalViewIssuesStore implements IGlobalViewIssuesStore {
  // states
  loader: boolean = false;
  error: any | null = null;

  // observables
  viewIssues: {
    [viewId: string]: IIssue[];
  } = {};

  // root store
  rootStore;

  // services
  projectService;
  workspaceService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      loader: observable.ref,
      error: observable.ref,

      // observables
      viewIssues: observable.ref,

      // actions
      fetchViewIssues: action,
    });

    this.rootStore = _rootStore;

    this.projectService = new ProjectService();
    this.workspaceService = new WorkspaceService();
  }

  computedFilter = (filters: any, filteredParams: any) => {
    const computedFilters: any = {};
    Object.keys(filters).map((key) => {
      if (filters[key] != undefined && filteredParams.includes(key))
        computedFilters[key] =
          typeof filters[key] === "string" || typeof filters[key] === "boolean" ? filters[key] : filters[key].join(",");
    });

    return computedFilters;
  };

  fetchViewIssues = async (workspaceSlug: string, viewId: string, filters: IIssueFilterOptions) => {
    try {
      runInAction(() => {
        this.loader = true;
      });

      const displayFilters = this.rootStore.workspaceFilter.workspaceDisplayFilters;

      let filteredRouteParams: any = {
        priority: filters?.priority || undefined,
        state_group: filters?.state_group || undefined,
        state: filters?.state || undefined,
        assignees: filters?.assignees || undefined,
        created_by: filters?.created_by || undefined,
        labels: filters?.labels || undefined,
        start_date: filters?.start_date || undefined,
        target_date: filters?.target_date || undefined,
        order_by: displayFilters?.order_by || "-created_at",
        type: displayFilters?.type || undefined,
        sub_issue: false,
      };

      const filteredParams = handleIssueQueryParamsByLayout("spreadsheet", "my_issues");
      if (filteredParams) filteredRouteParams = this.computedFilter(filteredRouteParams, filteredParams);

      const response = await this.workspaceService.getViewIssues(workspaceSlug, filteredRouteParams);

      runInAction(() => {
        this.loader = false;
        this.viewIssues = {
          ...this.viewIssues,
          [viewId]: response as IIssue[],
        };
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };
}

export default GlobalViewIssuesStore;

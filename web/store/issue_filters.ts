import { observable, action, computed, makeObservable, runInAction } from "mobx";
// services
import { ProjectService } from "services/project.service";
import { IssueService } from "services/issue.service";
// helpers
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";
// types
import { RootStore } from "./root";
import {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  IProjectViewProps,
  TIssueParams,
} from "types";

export interface IIssueFilterStore {
  loader: boolean;
  error: any | null;
  userDisplayProperties: IIssueDisplayProperties;
  userDisplayFilters: IIssueDisplayFilterOptions;
  userFilters: IIssueFilterOptions;
  defaultDisplayFilters: IIssueDisplayFilterOptions;
  defaultFilters: IIssueFilterOptions;
  filtersSearchQuery: string;

  // action
  fetchUserProjectFilters: (workspaceSlug: string, projectId: string) => Promise<void>;
  updateUserFilters: (
    workspaceSlug: string,
    projectId: string,
    filterToUpdate: Partial<IProjectViewProps>
  ) => Promise<void>;
  updateDisplayProperties: (
    workspaceSlug: string,
    projectId: string,
    properties: Partial<IIssueDisplayProperties>
  ) => Promise<void>;
  updateFiltersSearchQuery: (query: string) => void;

  // computed
  appliedFilters: TIssueParams[] | null;
}

class IssueFilterStore implements IIssueFilterStore {
  loader: boolean = false;
  error: any | null = null;

  // observables
  userDisplayProperties: any = {};
  userDisplayFilters: IIssueDisplayFilterOptions = {};
  userFilters: IIssueFilterOptions = {};
  defaultDisplayFilters: IIssueDisplayFilterOptions = {};
  defaultFilters: IIssueFilterOptions = {};
  defaultDisplayProperties: IIssueDisplayProperties = {
    assignee: true,
    start_date: true,
    due_date: true,
    labels: true,
    key: true,
    priority: true,
    state: true,
    sub_issue_count: true,
    link: true,
    attachment_count: true,
    estimate: true,
    created_on: true,
    updated_on: true,
  };
  filtersSearchQuery: string = "";

  // root store
  rootStore;

  // services
  projectService;
  issueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      loader: observable.ref,
      error: observable.ref,

      // observables
      defaultDisplayFilters: observable.ref,
      defaultFilters: observable.ref,
      userDisplayProperties: observable.ref,
      userDisplayFilters: observable.ref,
      userFilters: observable.ref,
      filtersSearchQuery: observable.ref,

      // actions
      fetchUserProjectFilters: action,
      updateUserFilters: action,
      updateDisplayProperties: action,
      updateFiltersSearchQuery: action,

      // computed
      appliedFilters: computed,
    });

    this.rootStore = _rootStore;

    this.projectService = new ProjectService();
    this.issueService = new IssueService();
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

  get appliedFilters(): TIssueParams[] | null {
    if (
      !this.userFilters ||
      Object.keys(this.userFilters).length === 0 ||
      !this.userDisplayFilters ||
      Object.keys(this.userDisplayFilters).length === 0
    )
      return null;

    let filteredRouteParams: any = {
      priority: this.userFilters?.priority || undefined,
      state_group: this.userFilters?.state_group || undefined,
      state: this.userFilters?.state || undefined,
      assignees: this.userFilters?.assignees || undefined,
      created_by: this.userFilters?.created_by || undefined,
      labels: this.userFilters?.labels || undefined,
      start_date: this.userFilters?.start_date || undefined,
      target_date: this.userFilters?.target_date || undefined,
      group_by: this.userDisplayFilters?.group_by || "state",
      order_by: this.userDisplayFilters?.order_by || "-created_at",
      sub_group_by: this.userDisplayFilters?.sub_group_by || undefined,
      type: this.userDisplayFilters?.type || undefined,
      sub_issue: this.userDisplayFilters?.sub_issue || true,
      show_empty_groups: this.userDisplayFilters?.show_empty_groups || true,
      start_target_date: this.userDisplayFilters?.start_target_date || true,
    };

    const filteredParams = handleIssueQueryParamsByLayout(this.userDisplayFilters.layout);
    if (filteredParams) filteredRouteParams = this.computedFilter(filteredRouteParams, filteredParams);

    return filteredRouteParams;
  }

  fetchUserProjectFilters = async (workspaceSlug: string, projectId: string) => {
    try {
      const memberResponse = await this.projectService.projectMemberMe(workspaceSlug, projectId);
      const issueProperties = await this.issueService.getIssueProperties(workspaceSlug, projectId);

      runInAction(() => {
        this.userFilters = memberResponse?.view_props?.filters;
        this.userDisplayFilters = memberResponse?.view_props?.display_filters ?? {};
        this.userDisplayProperties = issueProperties?.properties || this.defaultDisplayProperties;
        // default props from api
        this.defaultFilters = memberResponse.default_props.filters;
        this.defaultDisplayFilters = memberResponse.default_props.display_filters ?? {};
      });
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      console.log("Failed to fetch user filters in issue filter store", error);
    }
  };

  updateUserFilters = async (workspaceSlug: string, projectId: string, filterToUpdate: Partial<IProjectViewProps>) => {
    const newViewProps = {
      display_filters: {
        ...this.userDisplayFilters,
        ...filterToUpdate.display_filters,
      },
      filters: {
        ...this.userFilters,
        ...filterToUpdate.filters,
      },
    };

    try {
      runInAction(() => {
        this.userFilters = newViewProps.filters;
        this.userDisplayFilters = newViewProps.display_filters;
      });

      await this.projectService.setProjectView(workspaceSlug, projectId, {
        view_props: newViewProps,
      });
    } catch (error) {
      this.fetchUserProjectFilters(workspaceSlug, projectId);

      runInAction(() => {
        this.error = error;
      });

      console.log("Failed to update user filters in issue filter store", error);
    }
  };

  updateDisplayProperties = async (
    workspaceSlug: string,
    projectId: string,
    properties: Partial<IIssueDisplayProperties>
  ) => {
    const newProperties = {
      ...this.userDisplayProperties,
      ...properties,
    };

    try {
      runInAction(() => {
        this.userDisplayProperties = newProperties;
      });

      // await this.issueService.patchIssueProperties(workspaceSlug, projectId, newProperties);
    } catch (error) {
      this.fetchUserProjectFilters(workspaceSlug, projectId);

      runInAction(() => {
        this.error = error;
      });

      console.log("Failed to update user filters in issue filter store", error);
    }
  };

  updateFiltersSearchQuery: (query: string) => void = (query) => {
    runInAction(() => {
      this.filtersSearchQuery = query;
    });
  };
}

export default IssueFilterStore;

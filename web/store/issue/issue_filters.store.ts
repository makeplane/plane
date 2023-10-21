import { observable, action, computed, makeObservable, runInAction } from "mobx";
// services
import { ProjectService } from "services/project";
import { IssueService } from "services/issue";
// helpers
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";
// types
import { RootStore } from "../root";
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

  // computed
  appliedFilters: TIssueParams[] | null;
}

export class IssueFilterStore implements IIssueFilterStore {
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

      // actions
      fetchUserProjectFilters: action,
      updateUserFilters: action,
      updateDisplayProperties: action,

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
    if (!this.userFilters || !this.userDisplayFilters) return null;

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

    const filteredParams = handleIssueQueryParamsByLayout(this.userDisplayFilters.layout, "issues");
    if (filteredParams) filteredRouteParams = this.computedFilter(filteredRouteParams, filteredParams);

    if (this.userDisplayFilters.layout === "calendar") filteredRouteParams.group_by = "target_date";
    if (this.userDisplayFilters.layout === "gantt_chart") filteredRouteParams.start_target_date = true;

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

    // set sub_group_by to null if group_by is set to null
    if (newViewProps.display_filters.group_by === null) newViewProps.display_filters.sub_group_by = null;

    // set group_by to state if layout is switched to kanban and group_by is null
    if (newViewProps.display_filters.layout === "kanban" && newViewProps.display_filters.group_by === null)
      newViewProps.display_filters.group_by = "state";

    try {
      runInAction(() => {
        this.userFilters = newViewProps.filters;
        this.userDisplayFilters = newViewProps.display_filters;
      });

      this.projectService.setProjectView(workspaceSlug, projectId, {
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
}

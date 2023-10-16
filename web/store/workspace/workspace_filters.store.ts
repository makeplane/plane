import { observable, action, computed, makeObservable, runInAction } from "mobx";
// services
import { WorkspaceService } from "services/workspace.service";
// helpers
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";
// types
import { RootStore } from "../root";
import {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  IWorkspaceMember,
  IWorkspaceViewProps,
  TIssueParams,
} from "types";

export interface IWorkspaceFilterStore {
  // states
  loader: boolean;
  error: any | null;

  // observables
  workspaceFilters: IIssueFilterOptions;
  workspaceDisplayFilters: IIssueDisplayFilterOptions;
  workspaceDisplayProperties: IIssueDisplayProperties;

  // actions
  fetchUserWorkspaceFilters: (workspaceSlug: string) => Promise<IWorkspaceMember>;
  updateWorkspaceFilters: (workspaceSlug: string, filterToUpdate: Partial<IWorkspaceViewProps>) => Promise<void>;

  // computed
  appliedFilters: TIssueParams[] | null;
}

export class WorkspaceFilterStore implements IWorkspaceFilterStore {
  // states
  loader: boolean = false;
  error: any | null = null;

  // observables
  workspaceFilters: IIssueFilterOptions = {};
  workspaceDisplayFilters: IIssueDisplayFilterOptions = {};
  workspaceDisplayProperties: IIssueDisplayProperties = {
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
  workspaceService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      loader: observable.ref,
      error: observable.ref,

      // observables
      workspaceFilters: observable.ref,
      workspaceDisplayFilters: observable.ref,
      workspaceDisplayProperties: observable.ref,

      // actions
      fetchUserWorkspaceFilters: action,
      updateWorkspaceFilters: action,

      // computed
      appliedFilters: computed,
    });

    this.rootStore = _rootStore;

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

  get appliedFilters(): TIssueParams[] | null {
    if (!this.workspaceFilters || !this.workspaceDisplayFilters) return null;

    let filteredRouteParams: any = {
      priority: this.workspaceFilters?.priority || undefined,
      state_group: this.workspaceFilters?.state_group || undefined,
      state: this.workspaceFilters?.state || undefined,
      assignees: this.workspaceFilters?.assignees || undefined,
      created_by: this.workspaceFilters?.created_by || undefined,
      labels: this.workspaceFilters?.labels || undefined,
      start_date: this.workspaceFilters?.start_date || undefined,
      target_date: this.workspaceFilters?.target_date || undefined,
      group_by: this.workspaceDisplayFilters?.group_by || "state",
      order_by: this.workspaceDisplayFilters?.order_by || "-created_at",
      sub_group_by: this.workspaceDisplayFilters?.sub_group_by || undefined,
      type: this.workspaceDisplayFilters?.type || undefined,
      sub_issue: this.workspaceDisplayFilters?.sub_issue || true,
      show_empty_groups: this.workspaceDisplayFilters?.show_empty_groups || true,
      start_target_date: this.workspaceDisplayFilters?.start_target_date || true,
    };

    const filteredParams = handleIssueQueryParamsByLayout(this.workspaceDisplayFilters.layout, "issues");
    if (filteredParams) filteredRouteParams = this.computedFilter(filteredRouteParams, filteredParams);

    if (this.workspaceDisplayFilters.layout === "calendar") filteredRouteParams.group_by = "target_date";
    if (this.workspaceDisplayFilters.layout === "gantt_chart") filteredRouteParams.start_target_date = true;

    return filteredRouteParams;
  }

  fetchUserWorkspaceFilters = async (workspaceSlug: string) => {
    try {
      const memberResponse = await this.workspaceService.workspaceMemberMe(workspaceSlug);

      runInAction(() => {
        this.workspaceFilters = memberResponse?.view_props?.filters;
        this.workspaceDisplayFilters = memberResponse?.view_props?.display_filters ?? {};
        this.workspaceDisplayProperties = memberResponse?.view_props?.display_properties;
      });

      return memberResponse;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };

  updateWorkspaceFilters = async (workspaceSlug: string, filterToUpdate: Partial<IWorkspaceViewProps>) => {
    const newViewProps = {
      display_filters: {
        ...this.workspaceDisplayFilters,
        ...filterToUpdate.display_filters,
      },
      display_properties: {
        ...this.workspaceDisplayProperties,
        ...filterToUpdate.display_properties,
      },
      filters: {
        ...this.workspaceFilters,
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
        this.workspaceDisplayFilters = newViewProps.display_filters;
        this.workspaceDisplayProperties = newViewProps.display_properties;
        this.workspaceFilters = newViewProps.filters;
      });

      this.workspaceService.updateWorkspaceView(workspaceSlug, {
        view_props: newViewProps,
      });
    } catch (error) {
      this.fetchUserWorkspaceFilters(workspaceSlug);

      runInAction(() => {
        this.error = error;
      });

      console.log("Failed to update user filters in issue filter store", error);
    }
  };
}

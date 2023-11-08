import { observable, computed, makeObservable, action, runInAction } from "mobx";
// helpers
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";
// services
import { IssueService } from "services/issue";
import { ProjectService } from "services/project";
// types
import { RootStore } from "../root";
import {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  TIssueParams,
  IProjectViewProps,
} from "types";

export interface IArchivedIssueFilterStore {
  loader: boolean;
  error: any | null;

  // observables
  userDisplayProperties: IIssueDisplayProperties;
  userDisplayFilters: IIssueDisplayFilterOptions;
  userFilters: IIssueFilterOptions;

  // services
  projectService: ProjectService;
  issueService: IssueService;

  // computed
  appliedFilters: TIssueParams[] | null;

  // actions
  fetchUserProjectFilters: (workspaceSlug: string, projectId: string) => Promise<void>;
  updateUserFilters: (
    workspaceSlug: string,
    projectId: string,
    properties: Partial<IProjectViewProps>
  ) => Promise<void>;
  updateDisplayProperties: (
    workspaceSlug: string,
    projectId: string,
    properties: Partial<IIssueDisplayProperties>
  ) => Promise<void>;
}

export class ArchivedIssueFilterStore implements IArchivedIssueFilterStore {
  loader: boolean = false;
  error: any | null = null;

  // observables
  userFilters: IIssueFilterOptions = {
    priority: null,
    state_group: null,
    labels: null,
    start_date: null,
    target_date: null,
    assignees: null,
    created_by: null,
    subscriber: null,
  };
  userDisplayFilters: IIssueDisplayFilterOptions = {
    group_by: null,
    order_by: "sort_order",
    show_empty_groups: true,
    type: null,
    layout: "list",
  };
  userDisplayProperties: any = {
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
  projectService: ProjectService;
  issueService: IssueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      userFilters: observable.ref,
      userDisplayFilters: observable.ref,
      userDisplayProperties: observable.ref,

      // computed
      appliedFilters: computed,

      // actions
      fetchUserProjectFilters: action,
      updateUserFilters: action,
      updateDisplayProperties: action,
      computedFilter: action,
    });

    this.rootStore = _rootStore;

    // services
    this.issueService = new IssueService();
    this.projectService = new ProjectService();
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
      group_by: this.userDisplayFilters?.group_by,
      order_by: this.userDisplayFilters?.order_by || "-created_at",
      sub_group_by: this.userDisplayFilters?.sub_group_by || undefined,
      type: this.userDisplayFilters?.type || undefined,
      sub_issue: this.userDisplayFilters?.sub_issue || true,
      show_empty_groups: this.userDisplayFilters?.show_empty_groups || true,
      start_target_date: this.userDisplayFilters?.start_target_date || true,
    };

    const filteredParams = handleIssueQueryParamsByLayout("list", "issues");
    if (filteredParams) filteredRouteParams = this.computedFilter(filteredRouteParams, filteredParams);

    return filteredRouteParams;
  }

  updateUserFilters = async (workspaceSlug: string, projectId: string, properties: Partial<IProjectViewProps>) => {
    const newViewProps = {
      display_filters: {
        ...this.userDisplayFilters,
        ...properties.display_filters,
      },
      filters: {
        ...this.userFilters,
        ...properties.filters,
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
        this.userDisplayFilters = {
          ...newViewProps.display_filters,
          layout: "list",
        };
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
    const newProperties: IIssueDisplayProperties = {
      ...this.userDisplayProperties,
      ...properties,
    };

    try {
      runInAction(() => {
        this.userDisplayProperties = newProperties;
      });

      await this.issueService.updateIssueDisplayProperties(workspaceSlug, projectId, newProperties);
    } catch (error) {
      this.fetchUserProjectFilters(workspaceSlug, projectId);

      runInAction(() => {
        this.error = error;
      });

      console.log("Failed to update user display properties in issue filter store", error);
    }
  };

  fetchUserProjectFilters = async (workspaceSlug: string, projectId: string) => {
    try {
      const memberResponse = await this.projectService.projectMemberMe(workspaceSlug, projectId);
      const issueProperties = await this.issueService.getIssueDisplayProperties(workspaceSlug, projectId);

      runInAction(() => {
        this.userFilters = memberResponse?.view_props?.filters;
        this.userDisplayFilters = {
          ...(memberResponse?.view_props?.display_filters ?? {}),
          layout: "list",
        };
        this.userDisplayProperties = issueProperties?.properties;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      console.log("Failed to fetch user filters in issue filter store", error);
    }
  };
}

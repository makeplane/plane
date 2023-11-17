import { observable, action, computed, makeObservable, runInAction } from "mobx";
// base class
import { IssueFilterBaseStore } from "store/issues";
// services
import { ProjectService, ProjectMemberService } from "services/project";
import { IssueService } from "services/issue";
// helpers
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";
// types
import { RootStore } from "../../root";
import {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  IProjectViewProps,
  TIssueParams,
} from "types";

export interface IProjectIssuesFilterOptions {
  filters?: IIssueFilterOptions;
  displayFilters?: IIssueDisplayFilterOptions;
  displayProperties?: IIssueDisplayProperties;
}

export interface IProjectIssuesFilterStore {
  // observable
  loader: boolean;
  filters:
    | {
        [projectId: string]: IProjectIssuesFilterOptions;
      }
    | undefined;
  // computed
  issueFilters: IProjectIssuesFilterOptions | undefined;
  appliedFilters: TIssueParams[] | undefined;
  // actions
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
}

export class ProjectIssuesFilterStore extends IssueFilterBaseStore implements IProjectIssuesFilterStore {
  // observables
  loader: boolean = false;
  filters:
    | {
        [projectId: string]: {
          filters?: IIssueFilterOptions;
          displayFilters?: IIssueDisplayFilterOptions;
          displayProperties?: IIssueDisplayProperties;
        };
      }
    | undefined = undefined;
  // root store
  rootStore;
  // services
  projectService;
  projectMemberService;
  issueService;

  constructor(_rootStore: RootStore) {
    super(_rootStore);

    makeObservable(this, {
      // observables
      loader: observable.ref,
      filters: observable.ref,
      // computed
      issueFilters: computed,
      appliedFilters: computed,
      // actions
      fetchUserProjectFilters: action,
      updateUserFilters: action,
      updateDisplayProperties: action,
    });

    this.rootStore = _rootStore;

    this.projectService = new ProjectService();
    this.projectMemberService = new ProjectMemberService();
    this.issueService = new IssueService();
  }

  get issueFilters() {
    const projectId = this.rootStore.project.projectId;

    console.log("projectId", projectId);
    console.log("this.filters", this.filters);

    if (!projectId || !this.filters) return undefined;

    return this.filters[projectId];
  }

  get appliedFilters() {
    const userFilters = this.issueFilters;
    if (!userFilters) return undefined;

    let filteredRouteParams: any = {
      priority: userFilters?.filters?.priority || undefined,
      state_group: userFilters?.filters?.state_group || undefined,
      state: userFilters?.filters?.state || undefined,
      assignees: userFilters?.filters?.assignees || undefined,
      mentions: userFilters?.filters?.mentions || undefined,
      created_by: userFilters?.filters?.created_by || undefined,
      labels: userFilters?.filters?.labels || undefined,
      start_date: userFilters?.filters?.start_date || undefined,
      target_date: userFilters?.filters?.target_date || undefined,
      type: userFilters?.displayFilters?.type || undefined,
      sub_issue: userFilters?.displayFilters?.sub_issue || true,
      show_empty_groups: userFilters?.displayFilters?.show_empty_groups || true,
      start_target_date: userFilters?.displayFilters?.start_target_date || true,
    };

    const filteredParams = handleIssueQueryParamsByLayout(userFilters?.displayFilters?.layout, "issues");
    if (filteredParams) filteredRouteParams = this.computedFilter(filteredRouteParams, filteredParams);

    if (userFilters?.displayFilters?.layout === "calendar") filteredRouteParams.group_by = "target_date";
    if (userFilters?.displayFilters?.layout === "gantt_chart") filteredRouteParams.start_target_date = true;

    return filteredRouteParams;
  }

  fetchUserProjectFilters = async (workspaceSlug: string, projectId: string) => {
    try {
      const memberResponse = await this.projectMemberService.projectMemberMe(workspaceSlug, projectId);
      const issueProperties = await this.issueService.getIssueDisplayProperties(workspaceSlug, projectId);

      const _issueFilters = {
        filters: memberResponse?.view_props?.filters,
        displayFilters: {
          ...memberResponse?.view_props?.display_filters,
          calendar: {
            show_weekends: memberResponse?.view_props?.display_filters?.calendar?.show_weekends || true,
            layout: memberResponse?.view_props?.display_filters?.calendar?.layout || "month",
          },
        },
        displayProperties: issueProperties?.properties,
      };

      let _filters = this.filters;
      if (!_filters) _filters = {};
      if (!_filters[projectId]) _filters[projectId] = {};
      _filters[projectId] = _issueFilters;

      console.log("..._filters", _filters);

      runInAction(() => {
        this.filters = _filters;
      });
    } catch (error) {
      this.fetchUserProjectFilters(workspaceSlug, projectId);
      throw error;
    }
  };

  updateUserFilters = async (workspaceSlug: string, projectId: string, filterToUpdate: Partial<IProjectViewProps>) => {
    try {
      let _filters = this.filters;
      if (!_filters) _filters = {};
      if (!_filters[projectId]) _filters[projectId] = {};

      const updatedPropsPayload = {
        ..._filters[projectId],
        filters: {
          ..._filters[projectId]?.filters,
          ...filterToUpdate.filters,
        },
        displayFilters: {
          ..._filters[projectId]?.displayFilters,
          ...filterToUpdate.display_filters,
        },
      };

      // set sub_group_by to null if group_by is set to null
      if (updatedPropsPayload.displayFilters.group_by === null) updatedPropsPayload.displayFilters.sub_group_by = null;

      // set sub_group_by to null if layout is switched to kanban group_by and sub_group_by are same
      if (
        updatedPropsPayload.displayFilters.layout === "kanban" &&
        updatedPropsPayload.displayFilters.group_by === updatedPropsPayload.displayFilters.sub_group_by
      )
        updatedPropsPayload.displayFilters.sub_group_by = null;

      // set group_by to state if layout is switched to kanban and group_by is null
      if (
        updatedPropsPayload.displayFilters.layout === "kanban" &&
        updatedPropsPayload.displayFilters.group_by === null
      )
        updatedPropsPayload.displayFilters.group_by = "state";

      _filters[projectId] = updatedPropsPayload;

      runInAction(() => {
        this.filters = _filters;
      });

      const response = await this.projectService.setProjectView(workspaceSlug, projectId, {
        view_props: {
          filters: updatedPropsPayload.filters,
          display_filters: updatedPropsPayload.displayFilters,
        },
      });

      return response;
    } catch (error) {
      this.fetchUserProjectFilters(workspaceSlug, projectId);
      throw error;
    }
  };

  updateDisplayProperties = async (
    workspaceSlug: string,
    projectId: string,
    properties: Partial<IIssueDisplayProperties>
  ) => {
    try {
      let _filters = this.filters;
      if (!_filters) _filters = {};
      if (!_filters[projectId]) _filters[projectId] = {};

      const updatedPropertiesPayload = {
        ..._filters[projectId].displayProperties,
        ...properties,
      };

      _filters[projectId].displayProperties = updatedPropertiesPayload;

      runInAction(() => {
        this.filters = _filters;
      });

      const response = await this.issueService.updateIssueDisplayProperties(
        workspaceSlug,
        projectId,
        updatedPropertiesPayload
      );

      return response;
    } catch (error) {
      this.fetchUserProjectFilters(workspaceSlug, projectId);
      throw error;
    }
  };
}

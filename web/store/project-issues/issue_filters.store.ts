import { observable, action, computed, makeObservable, runInAction } from "mobx";
// services
import { ProjectService, ProjectMemberService } from "services/project";
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

export interface IProjectIssueFiltersStore {
  loader: boolean;
  error: any | null;
  userFilters: {
    [projectId: string]: {
      filters?: IIssueFilterOptions;
      displayFilters?: IIssueDisplayFilterOptions;
      displayProperties?: IIssueDisplayProperties;
    };
  };

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
  appliedFilters: TIssueParams[] | undefined;
  projectFilters:
    | {
        filters: IIssueFilterOptions;
        displayFilters: IIssueDisplayFilterOptions;
        displayProperties: IIssueDisplayProperties;
      }
    | undefined;
}

export class ProjectIssueFiltersStore implements IProjectIssueFiltersStore {
  loader: boolean = false;
  error: any | null = null;

  // observables
  userFilters: {
    [projectId: string]: {
      filters?: IIssueFilterOptions;
      displayFilters?: IIssueDisplayFilterOptions;
      displayProperties?: IIssueDisplayProperties;
    };
  } = {};

  // root store
  rootStore;

  // services
  projectService;
  projectMemberService;
  issueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      loader: observable.ref,
      error: observable.ref,

      // observables
      userFilters: observable.ref,

      // actions
      fetchUserProjectFilters: action,
      updateUserFilters: action,
      updateDisplayProperties: action,

      // computed
      appliedFilters: computed,
      projectFilters: computed,
    });

    this.rootStore = _rootStore;

    this.projectService = new ProjectService();
    this.projectMemberService = new ProjectMemberService();
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

  get appliedFilters(): TIssueParams[] | undefined {
    const projectId = this.rootStore.project.projectId;

    if (!projectId) return undefined;

    const userFilters = this.userFilters[projectId];

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

  get projectFilters():
    | {
        filters: IIssueFilterOptions;
        displayFilters: IIssueDisplayFilterOptions;
        displayProperties: IIssueDisplayProperties;
      }
    | undefined {
    const projectId = this.rootStore.project.projectId;

    if (!projectId) return undefined;

    const userFilters = this.userFilters[projectId];

    if (!userFilters) return undefined;

    return {
      filters: userFilters?.filters ?? {},
      displayFilters: userFilters?.displayFilters ?? {},
      displayProperties: userFilters?.displayProperties ?? {},
    };
  }

  fetchUserProjectFilters = async (workspaceSlug: string, projectId: string) => {
    try {
      const memberResponse = await this.projectMemberService.projectMemberMe(workspaceSlug, projectId);
      const issueProperties = await this.issueService.getIssueDisplayProperties(workspaceSlug, projectId);

      runInAction(() => {
        this.userFilters = {
          ...this.userFilters,
          [projectId]: {
            filters: memberResponse?.view_props?.filters,
            displayFilters: {
              ...memberResponse?.view_props?.display_filters,
              // add calendar display filters if not already present
              calendar: {
                show_weekends: memberResponse?.view_props?.display_filters?.calendar?.show_weekends || true,
                layout: memberResponse?.view_props?.display_filters?.calendar?.layout || "month",
              },
            },
            displayProperties: issueProperties?.properties,
          },
        };
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
      filters: {
        ...this.userFilters[projectId]?.filters,
        ...filterToUpdate.filters,
      },
      displayFilters: {
        ...this.userFilters[projectId]?.displayFilters,
        ...filterToUpdate.display_filters,
      },
      displayProperties: this.userFilters[projectId]?.displayProperties,
    };

    // set sub_group_by to null if group_by is set to null
    if (newViewProps.displayFilters.group_by === null) newViewProps.displayFilters.sub_group_by = null;

    // set sub_group_by to null if layout is switched to kanban group_by and sub_group_by are same
    if (
      newViewProps.displayFilters.layout === "kanban" &&
      newViewProps.displayFilters.group_by === newViewProps.displayFilters.sub_group_by
    )
      newViewProps.displayFilters.sub_group_by = null;

    // set group_by to state if layout is switched to kanban and group_by is null
    if (newViewProps.displayFilters.layout === "kanban" && newViewProps.displayFilters.group_by === null)
      newViewProps.displayFilters.group_by = "state";

    let updatedUserFilters = this.userFilters;
    if (!updatedUserFilters) updatedUserFilters = {};
    if (!updatedUserFilters[projectId]) updatedUserFilters[projectId] = {};

    updatedUserFilters[projectId] = newViewProps;

    try {
      runInAction(() => {
        this.userFilters = { ...updatedUserFilters };
      });

      this.projectService.setProjectView(workspaceSlug, projectId, {
        view_props: {
          filters: newViewProps.filters,
          display_filters: newViewProps.displayFilters,
        },
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
    const newDisplayProperties = {
      ...this.userFilters[projectId]?.displayProperties,
      ...properties,
    };

    try {
      runInAction(() => {
        this.userFilters[projectId] = {
          ...this.userFilters[projectId],
          displayProperties: newDisplayProperties,
        };
      });

      await this.issueService.updateIssueDisplayProperties(workspaceSlug, projectId, newDisplayProperties);
    } catch (error) {
      this.fetchUserProjectFilters(workspaceSlug, projectId);

      runInAction(() => {
        this.error = error;
      });

      console.log("Failed to update user display properties in issue filter store", error);
    }
  };
}

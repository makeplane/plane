import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "../root";
// services
import { WorkspaceService } from "services/workspace.service";
import { ProjectIssuesServices } from "services/issues.service";
import { ProjectStateServices } from "services/state.service";
import { ProjectServices } from "services/project.service";
// default data
import {
  filtersPriority,
  filterStateGroup,
  filtersStartDate,
  filtersDueDate,
  displayPropertyGroupBy,
  displayPropertyOrderBy,
  displayPropertyIssueType,
  displayProperties,
  extraProperties,
} from "./issue_data";

export type TIssueViews = "my_issues" | "issues" | "modules" | "views" | "cycles";
export type TIssueLayouts = "list" | "kanban" | "calendar" | "spreadsheet" | "gantt";
export interface IIssueFilter {
  priority: string[] | undefined;
  state: string[] | undefined;
  state_group: string[] | undefined;
  assignees: string[] | undefined;
  created_by: string[] | undefined;
  labels: string[] | undefined;
  start_date: string[] | undefined;
  target_date: string[] | undefined;
  [key: string]: any;
}

export interface IIssueDisplayFilters {
  group_by: undefined | string;
  order_by: undefined | string;
  type: string | undefined;
  sub_issue: boolean;
  show_empty_groups: boolean;
  layout: TIssueLayouts;
  calendar_date_range: string | undefined; // only for calendar
  start_target_date: boolean;
  [key: string]: any;
}

export interface IIssueDisplayProperties {
  assignee: boolean;
  attachment_count: boolean;
  created_on: boolean;
  due_date: boolean;
  estimate: boolean;
  key: boolean;
  labels: boolean;
  link: boolean;
  priority: boolean;
  start_date: boolean;
  state: boolean;
  sub_issue_count: boolean;
  updated_on: boolean;
  [key: string]: any;
}

export interface IIssueRenderFilters {
  priority: { key: string; title: string }[];
  state_group: { key: string; title: string }[];
  start_date: { key: string; title: string }[];
  due_date: { key: string; title: string }[];
  group_by: { key: string; title: string }[];
  order_by: { key: string; title: string }[];
  issue_type: { key: string; title: string }[];
  display_properties: { key: string; title: string }[];
  extra_properties: { key: string; title: string }[];
  workspace_properties: {
    [key: string]: {
      projects: any[];
      labels: any[];
      project_properties: {
        [key: string]: {
          states: any | null;
          labels: any[] | null;
          members: any[] | null;
        };
      };
    };
  };
}

export interface IIssueFilters {
  [key: string]: {
    my_issue_properties: {
      filters: IIssueFilter;
      display_filters: IIssueDisplayFilters;
      display_properties: IIssueDisplayProperties;
    };
    project_issue_properties: {
      [key: string]: {
        issues: {
          filters: IIssueFilter;
          display_filters: IIssueDisplayFilters;
        };
        cycles: {
          [key: string]: {
            filters: IIssueFilter;
          };
        };
        modules: {
          [key: string]: {
            filters: IIssueFilter;
          };
        };
        views: {
          [key: string]: {
            filters: IIssueFilter;
          };
        };
        display_properties: IIssueDisplayProperties;
      };
    };
  };
}

export interface IIssueFilterStore {
  loader: boolean;
  error: any | null;

  // current workspace and project id
  workspaceId: string | null;
  projectId: string | null;
  moduleId: string | null;
  cycleId: string | null;
  viewId: string | null;
  issueView: TIssueViews | null;

  issueRenderFilters: IIssueRenderFilters;
  issueFilters: IIssueFilters;

  filterRenderProperties:
    | {
        [key: string]: {
          isPreviewEnabled: boolean;
          totalElements: number;
          elementsVisible: number;
        };
      }[]
    | null;

  // actions
  getWorkspaceMyIssuesFilters: (workspaceId: string) => Promise<any>;
  updateWorkspaceMyIssuesFilters: () => any | Promise<any>;

  getProjectLevelMembers: (workspaceId: string, projectId: string) => any | Promise<any>;
  getProjectLevelStates: (workspaceId: string, projectId: string) => any | Promise<any>;
  getProjectLevelLabels: (workspaceId: string, projectId: string) => any | Promise<any>;
  getProjectDisplayFilters: (workspaceId: string, projectId: string) => any | Promise<any>;
  getProjectDisplayProperties: (workspaceId: string, projectId: string) => any | Promise<any>;

  getProjectIssueFilters: (workspaceId: string, projectId: string) => any | Promise<any>;
  getProjectIssueModuleFilters: (
    workspaceId: string,
    projectId: string,
    moduleId: string
  ) => any | Promise<any>;
  getProjectIssueCyclesFilters: (
    workspaceId: string,
    projectId: string,
    cycleId: string
  ) => any | Promise<any>;
  getProjectIssueViewsFilters: (
    workspaceId: string,
    projectId: string,
    viewId: string
  ) => any | Promise<any>;
}

class IssueFilterStore implements IIssueFilterStore {
  loader: boolean = false;
  error: any | null = null;

  workspaceId: string | null = null;
  projectId: string | null = null;
  moduleId: string | null = null;
  cycleId: string | null = null;
  viewId: string | null = null;

  issueView: TIssueViews | null = null;

  issueRenderFilters: IIssueRenderFilters = {
    priority: filtersPriority,
    state_group: filterStateGroup,
    start_date: filtersStartDate,
    due_date: filtersDueDate,
    group_by: displayPropertyGroupBy,
    order_by: displayPropertyOrderBy,
    issue_type: displayPropertyIssueType,
    display_properties: displayProperties,
    extra_properties: extraProperties,
    workspace_properties: {},
  };
  issueFilters: IIssueFilters = {};

  filterRenderProperties:
    | {
        [key: string]: {
          isPreviewEnabled: boolean;
          totalElements: number;
          elementsVisible: number;
        };
      }[]
    | null = null;

  // root store
  rootStore;
  // service
  workspaceService;
  issueService;
  stateService;
  projectService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable,
      error: observable,

      workspaceId: observable,
      projectId: observable,
      moduleId: observable,
      cycleId: observable,
      viewId: observable,

      issueView: observable,

      issueRenderFilters: observable.ref,
      issueFilters: observable.ref,

      // computed
      issueLayout: computed,
      workspaceProjects: computed,
      workspaceLabels: computed,
      projectStates: computed,
      projectLabels: computed,
      projectMembers: computed,
      projectDisplayProperties: computed,

      userFilters: computed,

      // action
      setWorkspaceId: action,
      setProjectId: action,
      setModuleId: action,
      setCycleId: action,
      setViewId: action,
      setIssueView: action,

      getComputedFilters: action,

      getWorkspaceMyIssuesFilters: action,
      updateWorkspaceMyIssuesFilters: action,

      getProjectLevelMembers: action,
      getProjectLevelStates: action,
      getProjectLevelLabels: action,
      getProjectDisplayFilters: action,
      getProjectDisplayProperties: action,

      getProjectIssueFilters: action,
      getProjectIssueModuleFilters: action,
      getProjectIssueCyclesFilters: action,
      getProjectIssueViewsFilters: action,
    });

    this.rootStore = _rootStore;
    this.workspaceService = new WorkspaceService();
    this.issueService = new ProjectIssuesServices();
    this.stateService = new ProjectStateServices();
    this.projectService = new ProjectServices();
  }

  setWorkspaceId = (_workspaceId: string | null) => (this.workspaceId = _workspaceId);
  setProjectId = (_projectId: string | null) => (this.projectId = _projectId);
  setModuleId = (_moduleId: string | null) => (this.moduleId = _moduleId);
  setCycleId = (_cycleId: string | null) => (this.cycleId = _cycleId);
  setViewId = (_viewId: string | null) => (this.viewId = _viewId);
  setIssueView = (_view: TIssueViews | null) => (this.issueView = _view);

  // computed
  get issueLayout() {
    if (!this.workspaceId) return null;
    if (!this.projectId)
      return this.issueFilters?.[this.workspaceId]?.my_issue_properties?.display_filters?.layout;
    if (this.projectId)
      return this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]
        ?.issues?.display_filters?.layout;
  }

  get workspaceProjects() {
    if (!this.workspaceId) return null;
    return this.issueRenderFilters?.workspace_properties?.[this.workspaceId]?.projects;
  }
  get workspaceLabels() {
    if (!this.workspaceId) return null;
    return this.issueRenderFilters?.workspace_properties?.[this.workspaceId]?.labels;
  }

  get projectStates() {
    if (!this.workspaceId || !this.projectId) return null;
    return this.issueRenderFilters?.workspace_properties?.[this.workspaceId]?.project_properties?.[
      this.projectId
    ]?.states;
  }
  get projectLabels() {
    if (!this.workspaceId || !this.projectId) return null;
    return this.issueRenderFilters?.workspace_properties?.[this.workspaceId]?.project_properties?.[
      this.projectId
    ]?.labels;
  }
  get projectMembers() {
    if (!this.workspaceId || !this.projectId) return null;
    return this.issueRenderFilters?.workspace_properties?.[this.workspaceId]?.project_properties?.[
      this.projectId
    ]?.members;
  }
  get projectDisplayProperties() {
    if (!this.workspaceId || !this.projectId) return null;
    return this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]
      ?.display_properties as any;
  }

  get userFilters() {
    if (!this.workspaceId) return null;
    if (this.issueView === "my_issues")
      return this.issueFilters?.[this.workspaceId]?.my_issue_properties;

    if (!this.projectId) return null;
    let _issueFilters: {
      filters: IIssueFilter | null;
      display_filters: IIssueDisplayFilters;
      display_properties: IIssueDisplayProperties;
    } = {
      filters: null,
      display_filters:
        this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.issues
          ?.display_filters,
      display_properties:
        this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]
          ?.display_properties,
    };
    if (this.issueView === "issues") {
      _issueFilters = {
        ..._issueFilters,
        filters:
          this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.issues
            ?.filters,
      };
      return _issueFilters;
    }
    if (this.issueView === "modules" && this.moduleId) {
      _issueFilters = {
        ..._issueFilters,
        filters:
          this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]
            ?.modules?.[this.moduleId]?.filters,
      };
      return _issueFilters;
    }
    if (this.issueView === "cycles" && this.cycleId) {
      _issueFilters = {
        ..._issueFilters,
        filters:
          this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]
            ?.cycles?.[this.cycleId]?.filters,
      };
      return _issueFilters;
    }
    if (this.issueView === "views" && this.viewId) {
      _issueFilters = {
        ..._issueFilters,
        filters:
          this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]
            ?.views?.[this.viewId]?.filters,
      };
      return _issueFilters;
    }
    return null;
  }
  handleUserFilter = () => {};

  computedFilter = (filters: any, filteredParams: any) => {
    const computedFilters: any = {};
    Object.keys(filters).map((key) => {
      if (filters[key] != undefined && filteredParams.includes(key))
        computedFilters[key] =
          typeof filters[key] === "string" || typeof filters[key] === "boolean"
            ? filters[key]
            : filters[key].join(",");
    });

    return computedFilters;
  };
  getComputedFilters = (
    _workspaceId: string | null,
    _projectId: string | null,
    _moduleId: string | null,
    _cycleId: string | null,
    _viewId: string | null,
    _issueView: TIssueViews,
    _issueLayout: TIssueLayouts
  ) => {
    this.setWorkspaceId(_workspaceId);
    this.setProjectId(_projectId);
    this.setModuleId(_moduleId);
    this.setCycleId(_cycleId);
    this.setViewId(_viewId);
    this.setIssueView(_issueView);

    const _layout = this.userFilters?.display_filters?.layout;

    let filteredRouteParams: any = {
      priority: this.userFilters?.filters?.priority || undefined,
      state_group: this.userFilters?.filters?.state_group || undefined,
      state: this.userFilters?.filters?.state || undefined,
      assignees: this.userFilters?.filters?.assignees || undefined,
      created_by: this.userFilters?.filters?.created_by || undefined,
      labels: this.userFilters?.filters?.labels || undefined,
      start_date: this.userFilters?.filters?.start_date || undefined,
      target_date: this.userFilters?.filters?.target_date || undefined,
      type: this.userFilters?.display_filters?.type || undefined,
      group_by: this.userFilters?.display_filters?.group_by || "state",
      order_by: this.userFilters?.display_filters?.order_by || "-created_at",
      sub_issue: this.userFilters?.display_filters?.sub_issue || true,
      show_empty_groups: this.userFilters?.display_filters?.show_empty_groups || true,
      calendar_date_range: this.userFilters?.display_filters?.calendar_date_range || undefined,
      start_target_date: this.userFilters?.display_filters?.start_target_date || true,
    };

    console.log("filteredRouteParams", filteredRouteParams);

    // start date and target date we have to construct the format here

    let filteredParams: any = {};
    if (_layout === "list")
      filteredParams = [
        "priority",
        "state_group",
        "state",
        "assignees",
        "created_by",
        "labels",
        "start_date",
        "target_date",
        "group_by",
        "order_by",
        "type",
        "sub_issue",
        "show_empty_groups",
      ];
    if (_layout === "kanban")
      filteredParams = [
        "priority",
        "state_group",
        "state",
        "assignees",
        "created_by",
        "labels",
        "start_date",
        "target_date",
        "type",
        "group_by",
        "order_by",
        "sub_issue",
      ];
    if (_layout === "calendar")
      filteredParams = [
        "priority",
        "state_group",
        "state",
        "assignees",
        "created_by",
        "labels",
        "start_date",
        "target_date",
        "type",
        "calendar_date_range",
      ];
    if (_layout === "spreadsheet")
      filteredParams = [
        "priority",
        "state_group",
        "state",
        "assignees",
        "created_by",
        "labels",
        "start_date",
        "target_date",
        "type",
        "sub_issues",
      ];
    if (_layout === "gantt")
      filteredParams = [
        "priority",
        "state",
        "assignees",
        "created_by",
        "labels",
        "start_date",
        "target_date",
        "order_by",
        "type",
        "sub_issue_id",
        "start_target_date",
      ];

    filteredRouteParams = this.computedFilter(filteredRouteParams, filteredParams);

    // remove few attributes from the object when we are in workspace issues
    console.log("filteredRouteParams", filteredRouteParams);

    return filteredRouteParams;
  };

  // services
  getWorkspaceMyIssuesProjects = async (workspaceId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const params = { is_favorite: false };
      const issuesProjectsResponse = await this.projectService.getProjects(workspaceId, params);

      if (issuesProjectsResponse) {
        const _issuesProjectsResponse = {
          ...this.issueRenderFilters,
          workspace_properties: {
            ...this.issueRenderFilters?.workspace_properties,
            [workspaceId]: {
              ...this.issueRenderFilters?.workspace_properties?.[workspaceId],
              projects: issuesProjectsResponse,
            },
          },
        };

        runInAction(() => {
          this.issueRenderFilters = _issuesProjectsResponse;
          this.loader = false;
          this.error = null;
        });
      }
      return issuesProjectsResponse;
    } catch (error) {
      console.warn("error in fetching workspace level projects", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };
  getWorkspaceMyIssuesLabels = async (workspaceId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const issuesLabelsResponse = await this.issueService.getWorkspaceLabels(workspaceId);

      if (issuesLabelsResponse) {
        const _issuesLabelsResponse = {
          ...this.issueRenderFilters,
          workspace_properties: {
            ...this.issueRenderFilters?.workspace_properties,
            [workspaceId]: {
              ...this.issueRenderFilters?.workspace_properties?.[workspaceId],
              labels: issuesLabelsResponse,
            },
          },
        };

        runInAction(() => {
          this.issueRenderFilters = _issuesLabelsResponse;
          this.loader = false;
          this.error = null;
        });
      }
      return issuesLabelsResponse;
    } catch (error) {
      console.warn("error in fetching workspace level labels", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };

  getWorkspaceMyIssuesFilters = async (workspaceId: string) => {
    try {
      this.loader = true;
      this.error = null;

      // fetching workspace level issue filters
      await this.getWorkspaceMyIssuesProjects(workspaceId);
      await this.getWorkspaceMyIssuesLabels(workspaceId);

      const issuesFiltersResponse = await this.workspaceService.workspaceMemberMe(workspaceId);
      if (issuesFiltersResponse) {
        const _issuesFiltersResponse: any = {
          ...this.issueFilters,
          [workspaceId]: {
            ...this?.issueFilters?.[workspaceId],
            my_issue_properties: {
              ...this?.issueFilters?.[workspaceId]?.my_issue_properties,
              filters: {
                priority: issuesFiltersResponse?.view_props?.filters?.priority ?? null,
                state: issuesFiltersResponse?.view_props?.filters?.state ?? null,
                state_group: issuesFiltersResponse?.view_props?.filters?.state_group ?? null,
                assignees: issuesFiltersResponse?.view_props?.filters?.assignees ?? null,
                created_by: issuesFiltersResponse?.view_props?.filters?.created_by ?? null,
                labels: issuesFiltersResponse?.view_props?.filters?.labels ?? null,
                start_date: issuesFiltersResponse?.view_props?.filters?.start_date ?? null,
                target_date: issuesFiltersResponse?.view_props?.filters?.target_date ?? null,
                subscriber: issuesFiltersResponse?.view_props?.filters?.subscriber ?? null,
              },
              display_filters: {
                group_by: issuesFiltersResponse?.view_props?.display_filters?.group_by ?? null,
                order_by: issuesFiltersResponse?.view_props?.display_filters?.order_by ?? null,
                type: issuesFiltersResponse?.view_props?.display_filters?.type ?? null,
                sub_issue: issuesFiltersResponse?.view_props?.display_filters?.sub_issue ?? false,
                show_empty_groups:
                  issuesFiltersResponse?.view_props?.display_filters?.show_empty_groups ?? false,
                layout: issuesFiltersResponse?.view_props?.display_filters?.layout ?? "list",
                calendar_date_range:
                  issuesFiltersResponse?.view_props?.display_filters?.calendar_date_range ?? false,
                start_target_date:
                  issuesFiltersResponse?.view_props?.display_filters?.start_target_date ?? true,
              },
              display_properties: {
                assignee: issuesFiltersResponse?.view_props?.display_properties?.assignee ?? false,
                attachment_count:
                  issuesFiltersResponse?.view_props?.display_properties?.attachment_count ?? false,
                created_on:
                  issuesFiltersResponse?.view_props?.display_properties?.created_on ?? false,
                due_date: issuesFiltersResponse?.view_props?.display_properties?.due_date ?? false,
                estimate: issuesFiltersResponse?.view_props?.display_properties?.estimate ?? false,
                key: issuesFiltersResponse?.view_props?.display_properties?.key ?? false,
                labels: issuesFiltersResponse?.view_props?.display_properties?.labels ?? false,
                link: issuesFiltersResponse?.view_props?.display_properties?.link ?? false,
                priority: issuesFiltersResponse?.view_props?.display_properties?.priority ?? false,
                start_date:
                  issuesFiltersResponse?.view_props?.display_properties?.start_date ?? false,
                state: issuesFiltersResponse?.view_props?.display_properties?.state ?? false,
                sub_issue_count:
                  issuesFiltersResponse?.view_props?.display_properties?.sub_issue_count ?? false,
                updated_on:
                  issuesFiltersResponse?.view_props?.display_properties?.updated_on ?? false,
              },
            },
          },
        };
        runInAction(() => {
          this.issueFilters = _issuesFiltersResponse;
          this.loader = false;
          this.error = null;
        });
      }
      return issuesFiltersResponse;
    } catch (error) {
      console.warn("error in fetching workspace level filters", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };
  updateWorkspaceMyIssuesFilters = async () => {
    try {
      this.loader = true;
      this.error = null;

      const workspaceId = "1";

      const issuesFiltersResponse = await this.workspaceService.workspaceMemberMe(workspaceId);

      if (issuesFiltersResponse) {
        // const _issuesFiltersResponse = this.issueFilters;
        //   const _issuesFiltersResponse: any = {
        //     ...this.issues,
        //     [workspaceId]: {
        //       ...this?.issues[workspaceId],
        //       my_issues: {
        //         ...this?.issues[workspaceId]?.my_issues,
        //         [_layout as string]: issuesResponse,
        //       },
        //     },
        //   };

        runInAction(() => {
          // this.issueFilters = _issuesFiltersResponse;
          this.loader = false;
          this.error = null;
        });
      }

      // return issuesResponse;
    } catch (error) {
      console.warn("error in fetching workspace level issue filters", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };

  getProjectLevelStates = async (workspaceId: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const issuesStateResponse = await this.stateService.getStates(workspaceId, projectId);
      if (issuesStateResponse) {
        const _issuesStateResponse = {
          ...this.issueRenderFilters,
          workspace_properties: {
            ...this.issueRenderFilters?.workspace_properties,
            [workspaceId]: {
              ...this.issueRenderFilters?.workspace_properties?.[workspaceId],
              project_properties: {
                ...this.issueRenderFilters?.workspace_properties?.[workspaceId]?.project_properties,
                [projectId]: {
                  ...this.issueRenderFilters?.workspace_properties?.[workspaceId]
                    ?.project_properties?.[projectId],
                  states: issuesStateResponse,
                },
              },
            },
          },
        };

        runInAction(() => {
          this.issueRenderFilters = _issuesStateResponse;
          this.loader = false;
          this.error = null;
        });
      }
      return issuesStateResponse;
    } catch (error) {
      console.warn("error in fetching project level states", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };
  getProjectLevelLabels = async (workspaceId: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const issuesLabelsResponse = await this.issueService.getIssueLabels(workspaceId, projectId);
      if (issuesLabelsResponse) {
        const _issuesLabelsResponse = {
          ...this.issueRenderFilters,
          workspace_properties: {
            ...this.issueRenderFilters?.workspace_properties,
            [workspaceId]: {
              ...this.issueRenderFilters?.workspace_properties?.[workspaceId],
              project_properties: {
                ...this.issueRenderFilters?.workspace_properties?.[workspaceId]?.project_properties,
                [projectId]: {
                  ...this.issueRenderFilters?.workspace_properties?.[workspaceId]
                    ?.project_properties?.[projectId],
                  labels: issuesLabelsResponse,
                },
              },
            },
          },
        };

        runInAction(() => {
          this.issueRenderFilters = _issuesLabelsResponse;
          this.loader = false;
          this.error = null;
        });
      }
      return issuesLabelsResponse;
    } catch (error) {
      console.warn("error in fetching project level labels", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };
  getProjectLevelMembers = async (workspaceId: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const issuesMembersResponse = await this.projectService.projectMembers(
        workspaceId,
        projectId
      );
      if (issuesMembersResponse) {
        const _issuesMembersResponse = {
          ...this.issueRenderFilters,
          workspace_properties: {
            ...this.issueRenderFilters?.workspace_properties,
            [workspaceId]: {
              ...this.issueRenderFilters?.workspace_properties?.[workspaceId],
              project_properties: {
                ...this.issueRenderFilters?.workspace_properties?.[workspaceId]?.project_properties,
                [projectId]: {
                  ...this.issueRenderFilters?.workspace_properties?.[workspaceId]
                    ?.project_properties?.[projectId],
                  members: issuesMembersResponse,
                },
              },
            },
          },
        };

        runInAction(() => {
          this.issueRenderFilters = _issuesMembersResponse;
          this.loader = false;
          this.error = null;
        });
      }
      return issuesMembersResponse;
    } catch (error) {
      console.warn("error in fetching project level members", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };

  getProjectDisplayProperties = async (workspaceId: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const issuesDisplayPropertiesResponse = await this.issueService.getIssueProperties(
        workspaceId,
        projectId
      );

      if (issuesDisplayPropertiesResponse) {
        const _issuesDisplayPropertiesResponse: any = {
          ...this.issueFilters,
          [workspaceId]: {
            ...this?.issueFilters[workspaceId],
            project_issue_properties: {
              ...this?.issueFilters[workspaceId]?.project_issue_properties,
              [projectId]: {
                ...this?.issueFilters[workspaceId]?.project_issue_properties?.[projectId],
                display_properties: issuesDisplayPropertiesResponse?.properties,
              },
            },
          },
        };

        runInAction(() => {
          this.issueFilters = _issuesDisplayPropertiesResponse;
          this.loader = false;
          this.error = null;
        });
      }

      return issuesDisplayPropertiesResponse;
    } catch (error) {
      console.warn("error in fetching project level display properties", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };
  updateProjectDisplayProperties = async (workspaceId: string, projectId: string, data: any) => {
    try {
      this.loader = true;
      this.error = null;

      const issuesDisplayPropertiesResponse = await this.issueService.getIssueProperties(
        workspaceId,
        projectId
      );

      if (issuesDisplayPropertiesResponse) {
        const _issuesDisplayPropertiesResponse: any = {
          ...this.issueFilters,
          [workspaceId]: {
            ...this?.issueFilters[workspaceId],
            project_issue_properties: {
              ...this?.issueFilters[workspaceId]?.project_issue_properties,
              [projectId]: {
                ...this?.issueFilters[workspaceId]?.project_issue_properties?.[projectId],
                display_properties: issuesDisplayPropertiesResponse,
              },
            },
          },
        };

        runInAction(() => {
          this.issueFilters = _issuesDisplayPropertiesResponse;
          this.loader = false;
          this.error = null;
        });
      }

      return issuesDisplayPropertiesResponse;
    } catch (error) {
      console.warn("error in fetching project level display properties", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };

  getProjectDisplayFilters = async (workspaceId: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const issuesDisplayFiltersResponse = await this.projectService.projectMemberMe(
        workspaceId,
        projectId
      );

      if (issuesDisplayFiltersResponse) {
        const _filters = { ...issuesDisplayFiltersResponse?.view_props?.filters };
        const _displayFilters = { ...issuesDisplayFiltersResponse?.view_props?.display_filters };

        const _issuesDisplayFiltersResponse: any = {
          ...this.issueFilters,
          [workspaceId]: {
            ...this?.issueFilters[workspaceId],
            project_issue_properties: {
              ...this?.issueFilters[workspaceId]?.project_issue_properties,
              [projectId]: {
                ...this?.issueFilters[workspaceId]?.project_issue_properties?.[projectId],
                issues: {
                  ...this?.issueFilters[workspaceId]?.project_issue_properties?.[projectId]?.issues,
                  filters: _filters,
                  display_filters: _displayFilters,
                },
              },
            },
          },
        };

        runInAction(() => {
          this.issueFilters = _issuesDisplayFiltersResponse;
          this.loader = false;
          this.error = null;
        });
      }

      // return issuesResponse;
    } catch (error) {
      console.warn("error in fetching workspace level issue filters", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };
  updateProjectDisplayFilters = async (workspaceId: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const workspaceId = "1";

      const issuesFiltersResponse = await this.workspaceService.workspaceMemberMe(workspaceId);

      if (issuesFiltersResponse) {
        // const _issuesFiltersResponse = this.issueFilters;
        //   const _issuesFiltersResponse: any = {
        //     ...this.issues,
        //     [workspaceId]: {
        //       ...this?.issues[workspaceId],
        //       my_issues: {
        //         ...this?.issues[workspaceId]?.my_issues,
        //         [_layout as string]: issuesResponse,
        //       },
        //     },
        //   };

        runInAction(() => {
          // this.issueFilters = _issuesFiltersResponse;
          this.loader = false;
          this.error = null;
        });
      }

      // return issuesResponse;
    } catch (error) {
      console.warn("error in fetching workspace level issue filters", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };

  getProjectIssueFilters = async (workspaceId: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      await this.getProjectLevelStates(workspaceId, projectId);
      await this.getProjectLevelLabels(workspaceId, projectId);
      await this.getProjectLevelMembers(workspaceId, projectId);
      await this.getProjectDisplayProperties(workspaceId, projectId);
      await this.getProjectDisplayFilters(workspaceId, projectId);

      runInAction(() => {
        this.loader = false;
        this.error = null;
      });

      // return issuesResponse;
    } catch (error) {
      console.warn("error in fetching workspace level issue filters", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };
  updateProjectIssueFilters = async (workspaceId: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const issuesFiltersResponse = await this.workspaceService.workspaceMemberMe(workspaceId);

      if (issuesFiltersResponse) {
        // const _issuesFiltersResponse = this.issueFilters;
        //   const _issuesFiltersResponse: any = {
        //     ...this.issues,
        //     [workspaceId]: {
        //       ...this?.issues[workspaceId],
        //       my_issues: {
        //         ...this?.issues[workspaceId]?.my_issues,
        //         [_layout as string]: issuesResponse,
        //       },
        //     },
        //   };

        runInAction(() => {
          // this.issueFilters = _issuesFiltersResponse;
          this.loader = false;
          this.error = null;
        });
      }

      // return issuesResponse;
    } catch (error) {
      console.warn("error in fetching workspace level issue filters", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };

  getProjectIssueModuleFilters = async (
    workspaceId: string,
    projectId: string,
    moduleId: string
  ) => {
    try {
      this.loader = true;
      this.error = null;

      const workspaceId = "1";

      const issuesFiltersResponse = await this.workspaceService.workspaceMemberMe(workspaceId);

      if (issuesFiltersResponse) {
        // const _issuesFiltersResponse = this.issueFilters;
        //   const _issuesFiltersResponse: any = {
        //     ...this.issues,
        //     [workspaceId]: {
        //       ...this?.issues[workspaceId],
        //       my_issues: {
        //         ...this?.issues[workspaceId]?.my_issues,
        //         [_layout as string]: issuesResponse,
        //       },
        //     },
        //   };

        runInAction(() => {
          // this.issueFilters = _issuesFiltersResponse;
          this.loader = false;
          this.error = null;
        });
      }

      // return issuesResponse;
    } catch (error) {
      console.warn("error in fetching workspace level issue filters", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };
  updateProjectIssueModuleFilters = async (
    workspaceId: string,
    projectId: string,
    moduleId: string
  ) => {
    try {
      this.loader = true;
      this.error = null;

      const workspaceId = "1";

      const issuesFiltersResponse = await this.workspaceService.workspaceMemberMe(workspaceId);

      if (issuesFiltersResponse) {
        // const _issuesFiltersResponse = this.issueFilters;
        //   const _issuesFiltersResponse: any = {
        //     ...this.issues,
        //     [workspaceId]: {
        //       ...this?.issues[workspaceId],
        //       my_issues: {
        //         ...this?.issues[workspaceId]?.my_issues,
        //         [_layout as string]: issuesResponse,
        //       },
        //     },
        //   };

        runInAction(() => {
          // this.issueFilters = _issuesFiltersResponse;
          this.loader = false;
          this.error = null;
        });
      }

      // return issuesResponse;
    } catch (error) {
      console.warn("error in fetching workspace level issue filters", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };

  getProjectIssueCyclesFilters = async (
    workspaceId: string,
    projectId: string,
    cycleId: string
  ) => {
    try {
      this.loader = true;
      this.error = null;

      const workspaceId = "1";

      const issuesFiltersResponse = await this.workspaceService.workspaceMemberMe(workspaceId);

      if (issuesFiltersResponse) {
        // const _issuesFiltersResponse = this.issueFilters;
        //   const _issuesFiltersResponse: any = {
        //     ...this.issues,
        //     [workspaceId]: {
        //       ...this?.issues[workspaceId],
        //       my_issues: {
        //         ...this?.issues[workspaceId]?.my_issues,
        //         [_layout as string]: issuesResponse,
        //       },
        //     },
        //   };

        runInAction(() => {
          // this.issueFilters = _issuesFiltersResponse;
          this.loader = false;
          this.error = null;
        });
      }

      // return issuesResponse;
    } catch (error) {
      console.warn("error in fetching workspace level issue filters", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };
  updateProjectIssueCyclesFilters = async (
    workspaceId: string,
    projectId: string,
    cycleId: string
  ) => {
    try {
      this.loader = true;
      this.error = null;

      const workspaceId = "1";

      const issuesFiltersResponse = await this.workspaceService.workspaceMemberMe(workspaceId);

      if (issuesFiltersResponse) {
        // const _issuesFiltersResponse = this.issueFilters;
        //   const _issuesFiltersResponse: any = {
        //     ...this.issues,
        //     [workspaceId]: {
        //       ...this?.issues[workspaceId],
        //       my_issues: {
        //         ...this?.issues[workspaceId]?.my_issues,
        //         [_layout as string]: issuesResponse,
        //       },
        //     },
        //   };

        runInAction(() => {
          // this.issueFilters = _issuesFiltersResponse;
          this.loader = false;
          this.error = null;
        });
      }

      // return issuesResponse;
    } catch (error) {
      console.warn("error in fetching workspace level issue filters", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };

  getProjectIssueViewsFilters = async (workspaceId: string, projectId: string, viewId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const workspaceId = "1";

      const issuesFiltersResponse = await this.workspaceService.workspaceMemberMe(workspaceId);

      if (issuesFiltersResponse) {
        // const _issuesFiltersResponse = this.issueFilters;
        //   const _issuesFiltersResponse: any = {
        //     ...this.issues,
        //     [workspaceId]: {
        //       ...this?.issues[workspaceId],
        //       my_issues: {
        //         ...this?.issues[workspaceId]?.my_issues,
        //         [_layout as string]: issuesResponse,
        //       },
        //     },
        //   };

        runInAction(() => {
          // this.issueFilters = _issuesFiltersResponse;
          this.loader = false;
          this.error = null;
        });
      }

      // return issuesResponse;
    } catch (error) {
      console.warn("error in fetching workspace level issue filters", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };
  updateProjectIssueViewsFilters = async (
    workspaceId: string,
    projectId: string,
    viewId: string
  ) => {
    try {
      this.loader = true;
      this.error = null;

      const workspaceId = "1";

      const issuesFiltersResponse = await this.workspaceService.workspaceMemberMe(workspaceId);

      if (issuesFiltersResponse) {
        // const _issuesFiltersResponse = this.issueFilters;
        //   const _issuesFiltersResponse: any = {
        //     ...this.issues,
        //     [workspaceId]: {
        //       ...this?.issues[workspaceId],
        //       my_issues: {
        //         ...this?.issues[workspaceId]?.my_issues,
        //         [_layout as string]: issuesResponse,
        //       },
        //     },
        //   };

        runInAction(() => {
          // this.issueFilters = _issuesFiltersResponse;
          this.loader = false;
          this.error = null;
        });
      }

      // return issuesResponse;
    } catch (error) {
      console.warn("error in fetching workspace level issue filters", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };
  // project level filters ends
}

export default IssueFilterStore;

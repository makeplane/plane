import { observable, action, computed, makeObservable, runInAction, autorun } from "mobx";
// types
import { RootStore } from "../root";
// services
import { WorkspaceService } from "services/workspace.service";
import { ProjectIssuesServices } from "services/issues.service";
import { ProjectStateServices } from "services/state.service";
import { ProjectServices } from "services/project.service";
import { ProjectIssuesServices as ProjectModuleServices } from "services/modules.service";
import { ProjectCycleServices } from "services/cycles.service";
import { ViewServices as ProjectViewServices } from "services/views.service";
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
export type TIssueLayouts = "list" | "kanban" | "calendar" | "spreadsheet" | "gantt_chart";
export type TIssueParams =
  | "priority"
  | "state_group"
  | "state"
  | "assignees"
  | "created_by"
  | "labels"
  | "start_date"
  | "target_date"
  | "group_by"
  | "order_by"
  | "type"
  | "sub_issue"
  | "show_empty_groups"
  | "calendar_date_range"
  | "start_target_date";

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
      display_properties_id: null;
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
        display_properties_id: string;
        display_properties: IIssueDisplayProperties;
      };
    };
  };
}

export interface IIssueFilterStore {
  loader: boolean;
  error: any | null;

  // current workspace and project id
  myUserId: string | null;
  workspaceId: string | null;
  projectId: string | null;
  moduleId: string | null;
  cycleId: string | null;
  viewId: string | null;
  issueView: TIssueViews | null;

  issueRenderFilters: IIssueRenderFilters;
  issueFilters: IIssueFilters;

  // actions
  getWorkspaceMyIssuesFilters: (workspaceId: string) => Promise<any>;
  updateWorkspaceMyIssuesFilters: (workspaceId: string, data: any) => Promise<any>;

  getProjectLevelMembers: (workspaceId: string, projectId: string) => Promise<any>;
  getProjectLevelStates: (workspaceId: string, projectId: string) => Promise<any>;
  getProjectLevelLabels: (workspaceId: string, projectId: string) => Promise<any>;
  getProjectDisplayProperties: (workspaceId: string, projectId: string) => Promise<any>;
  updateProjectDisplayProperties: (
    workspaceId: string,
    projectId: string,
    display_properties_id: string,
    data: any
  ) => Promise<any>;
  getProjectDisplayFilters: (workspaceId: string, projectId: string) => Promise<any>;
  updateProjectDisplayFilters: (workspaceId: string, projectId: string, data: any) => Promise<any>;

  getProjectIssueFilters: (workspaceId: string, projectId: string) => Promise<any>;

  getProjectIssueModuleFilters: (workspaceId: string, projectId: string, moduleId: string) => Promise<any>;
  updateProjectIssueModuleFilters: (
    workspaceId: string,
    projectId: string,
    moduleId: string,
    data: any
  ) => Promise<any>;
  getProjectIssueCyclesFilters: (workspaceId: string, projectId: string, cycleId: string) => Promise<any>;
  updateProjectIssueCyclesFilters: (workspaceId: string, projectId: string, cycleId: string, data: any) => Promise<any>;
  getProjectIssueViewsFilters: (workspaceId: string, projectId: string, viewId: string) => Promise<any>;
  updateProjectIssueViewsFilters: (workspaceId: string, projectId: string, viewId: string, data: any) => Promise<any>;
}

class IssueFilterStore implements IIssueFilterStore {
  loader: boolean = false;
  error: any | null = null;

  myUserId: string | null = null;
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

  // root store
  rootStore;
  // service
  workspaceService;
  issueService;
  stateService;
  projectService;
  moduleService;
  cycleService;
  viewService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable,
      error: observable,

      myUserId: observable,
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

      // actions
      getComputedFilters: action,

      handleUserFilter: action,

      getWorkspaceMyIssuesFilters: action,
      updateWorkspaceMyIssuesFilters: action,

      getProjectLevelMembers: action,
      getProjectLevelStates: action,
      getProjectLevelLabels: action,

      getProjectDisplayFilters: action,
      updateProjectDisplayFilters: action,

      getProjectDisplayProperties: action,
      updateProjectDisplayProperties: action,

      getProjectIssueFilters: action,

      getProjectIssueModuleFilters: action,
      updateProjectIssueModuleFilters: action,

      getProjectIssueCyclesFilters: action,
      updateProjectIssueCyclesFilters: action,

      getProjectIssueViewsFilters: action,
      updateProjectIssueViewsFilters: action,
    });

    this.rootStore = _rootStore;
    this.workspaceService = new WorkspaceService();
    this.issueService = new ProjectIssuesServices();
    this.stateService = new ProjectStateServices();
    this.projectService = new ProjectServices();
    this.moduleService = new ProjectModuleServices();
    this.cycleService = new ProjectCycleServices();
    this.viewService = new ProjectViewServices();
  }

  // computed
  get issueLayout() {
    if (!this.workspaceId) return null;
    if (!this.projectId) return this.issueFilters?.[this.workspaceId]?.my_issue_properties?.display_filters?.layout;
    if (this.projectId)
      return this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.issues?.display_filters
        ?.layout;
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
    return this.issueRenderFilters?.workspace_properties?.[this.workspaceId]?.project_properties?.[this.projectId]
      ?.states;
  }
  get projectLabels() {
    if (!this.workspaceId || !this.projectId) return null;
    return this.issueRenderFilters?.workspace_properties?.[this.workspaceId]?.project_properties?.[this.projectId]
      ?.labels;
  }
  get projectMembers() {
    if (!this.workspaceId || !this.projectId) return null;
    return this.issueRenderFilters?.workspace_properties?.[this.workspaceId]?.project_properties?.[this.projectId]
      ?.members;
  }
  get projectDisplayProperties() {
    if (!this.workspaceId || !this.projectId) return null;
    return this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.display_properties as any;
  }

  get userFilters() {
    if (!this.workspaceId) return null;
    if (this.issueView === "my_issues")
      return {
        ...this.issueFilters?.[this.workspaceId]?.my_issue_properties,
        display_properties_id: null,
      };

    if (!this.projectId) return null;
    let _issueFilters: {
      filters: IIssueFilter | null;
      display_filters: IIssueDisplayFilters;
      display_properties_id: string;
      display_properties: IIssueDisplayProperties;
    } = {
      filters: null,
      display_filters:
        this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.issues?.display_filters,
      display_properties_id:
        this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.display_properties_id,
      display_properties:
        this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.display_properties,
    };

    if (this.issueView === "issues") {
      _issueFilters = {
        ..._issueFilters,
        filters: this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.issues?.filters,
      };
      return _issueFilters;
    }

    if (this.issueView === "modules" && this.moduleId) {
      _issueFilters = {
        ..._issueFilters,
        filters:
          this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.modules?.[this.moduleId]
            ?.filters,
      };
      return _issueFilters;
    }

    if (this.issueView === "cycles" && this.cycleId) {
      _issueFilters = {
        ..._issueFilters,
        filters:
          this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.cycles?.[this.cycleId]
            ?.filters,
      };
      return _issueFilters;
    }

    if (this.issueView === "views" && this.viewId) {
      _issueFilters = {
        ..._issueFilters,
        filters:
          this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.views?.[this.viewId]
            ?.filters,
      };
      return _issueFilters;
    }

    return null;
  }
  handleUserFilter = (
    filter_type: "filters" | "display_filters" | "display_properties",
    filter_key: string,
    value: any
  ) => {
    if (!this.workspaceId) return null;

    if (this.issueView === "my_issues") {
      this.issueFilters = {
        ...this.issueFilters,
        [this.workspaceId]: {
          ...this.issueFilters?.[this.workspaceId],
          my_issue_properties: {
            ...this.issueFilters?.[this.workspaceId]?.my_issue_properties,
            [filter_type]: {
              ...this.issueFilters?.[this.workspaceId]?.my_issue_properties?.[filter_type],
              [filter_key]: value,
            },
          },
        },
      };
      this.updateWorkspaceMyIssuesFilters(this.workspaceId, this.userFilters);
    }

    if (!this.projectId) return null;
    if (filter_type === "display_properties") {
      this.issueFilters = {
        ...this.issueFilters,
        [this.workspaceId]: {
          ...this.issueFilters?.[this.workspaceId],
          project_issue_properties: {
            ...this.issueFilters?.[this.workspaceId]?.project_issue_properties,
            [this.projectId]: {
              ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId],
              display_properties: {
                ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]
                  ?.display_properties,
                [filter_key]: value,
              },
            },
          },
        },
      };

      if (this.userFilters?.display_properties_id) {
        this.updateProjectDisplayProperties(
          this.workspaceId,
          this.projectId,
          this.userFilters?.display_properties_id,
          this.userFilters?.display_properties
        );
      }
    }

    if (filter_type === "display_filters") {
      this.issueFilters = {
        ...this.issueFilters,
        [this.workspaceId]: {
          ...this.issueFilters?.[this.workspaceId],
          project_issue_properties: {
            ...this.issueFilters?.[this.workspaceId]?.project_issue_properties,
            [this.projectId]: {
              ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId],
              issues: {
                ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.issues,
                [filter_type]: {
                  ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.issues?.[
                    filter_type
                  ],
                  [filter_key]: value,
                },
              },
            },
          },
        },
      };
      this.updateProjectDisplayFilters(this.workspaceId, this.projectId, {
        filters: this.userFilters?.filters,
        display_filters: this.userFilters?.display_filters,
      });
    }

    if (filter_type === "filters") {
      if (this.issueView === "issues") {
        this.issueFilters = {
          ...this.issueFilters,
          [this.workspaceId]: {
            ...this.issueFilters?.[this.workspaceId],
            project_issue_properties: {
              ...this.issueFilters?.[this.workspaceId]?.project_issue_properties,
              [this.projectId]: {
                ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId],
                issues: {
                  ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.issues,
                  [filter_type]: {
                    ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.issues?.[
                      filter_type
                    ],
                    [filter_key]: value,
                  },
                },
              },
            },
          },
        };
        this.updateProjectDisplayFilters(this.workspaceId, this.projectId, {
          filters: this.userFilters?.filters,
          display_filters: this.userFilters?.display_filters,
        });
      }

      if (this.issueView === "modules" && this.moduleId) {
        this.issueFilters = {
          ...this.issueFilters,
          [this.workspaceId]: {
            ...this.issueFilters?.[this.workspaceId],
            project_issue_properties: {
              ...this.issueFilters?.[this.workspaceId]?.project_issue_properties,
              [this.projectId]: {
                ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId],
                modules: {
                  ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.modules,
                  [this.moduleId]: {
                    ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.modules?.[
                      this.moduleId
                    ],
                    [filter_type]: {
                      ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.modules?.[
                        this.moduleId
                      ]?.[filter_type],
                      [filter_key]: value,
                    },
                  },
                },
              },
            },
          },
        };
        this.updateProjectIssueModuleFilters(
          this.workspaceId,
          this.projectId,
          this.moduleId,
          this.userFilters?.filters
        );
      }

      if (this.issueView === "cycles" && this.cycleId) {
        this.issueFilters = {
          ...this.issueFilters,
          [this.workspaceId]: {
            ...this.issueFilters?.[this.workspaceId],
            project_issue_properties: {
              ...this.issueFilters?.[this.workspaceId]?.project_issue_properties,
              [this.projectId]: {
                ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId],
                cycles: {
                  ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.cycles,
                  [this.cycleId]: {
                    ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.cycles?.[
                      this.cycleId
                    ],
                    [filter_type]: {
                      ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.cycles?.[
                        this.cycleId
                      ]?.[filter_type],
                      [filter_key]: value,
                    },
                  },
                },
              },
            },
          },
        };
        this.updateProjectIssueCyclesFilters(this.workspaceId, this.projectId, this.cycleId, this.userFilters?.filters);
      }

      if (this.issueView === "views" && this.viewId) {
        this.issueFilters = {
          ...this.issueFilters,
          [this.workspaceId]: {
            ...this.issueFilters?.[this.workspaceId],
            project_issue_properties: {
              ...this.issueFilters?.[this.workspaceId]?.project_issue_properties,
              [this.projectId]: {
                ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId],
                views: {
                  ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.views,
                  [this.viewId]: {
                    ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.views?.[
                      this.viewId
                    ],
                    [filter_type]: {
                      ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.views?.[
                        this.viewId
                      ]?.[filter_type],
                      [filter_key]: value,
                    },
                  },
                },
              },
            },
          },
        };
        this.updateProjectIssueViewsFilters(this.workspaceId, this.projectId, this.viewId, this.userFilters?.filters);
      }
    }

    if (this.issueView === "my_issues")
      this.rootStore?.issueView?.getProjectIssuesAsync(this.workspaceId, this.projectId, false);
    if (this.issueView === "issues")
      this.rootStore?.issueView?.getProjectIssuesAsync(this.workspaceId, this.projectId, false);
    if (this.issueView === "modules" && this.moduleId)
      this.rootStore?.issueView?.getIssuesForModulesAsync(this.workspaceId, this.projectId, this.moduleId, false);
    if (this.issueView === "cycles" && this.cycleId)
      this.rootStore?.issueView?.getIssuesForCyclesAsync(this.workspaceId, this.projectId, this.cycleId, false);
    if (this.issueView === "views" && this.viewId)
      this.rootStore?.issueView?.getIssuesForViewsAsync(this.workspaceId, this.projectId, this.viewId, false);
  };

  computedFilter = (filters: any, filteredParams: any) => {
    const computedFilters: any = {};
    Object.keys(filters).map((key) => {
      if (filters[key] != undefined && filteredParams.includes(key))
        computedFilters[key] =
          typeof filters[key] === "string" || typeof filters[key] === "boolean" ? filters[key] : filters[key].join(",");
    });

    return computedFilters;
  };
  getComputedFilters = (
    _workspaceId: string | null,
    _projectId: string | null,
    _moduleId: string | null,
    _cycleId: string | null,
    _viewId: string | null,
    _issueView: TIssueViews
  ) => {
    this.workspaceId = _workspaceId;
    this.projectId = _projectId;
    this.moduleId = _moduleId;
    this.cycleId = _cycleId;
    this.viewId = _viewId;
    this.issueView = _issueView;

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
      group_by: this.userFilters?.display_filters?.group_by || "state",
      order_by: this.userFilters?.display_filters?.order_by || "-created_at",
      type: this.userFilters?.display_filters?.type || undefined,
      sub_issue: this.userFilters?.display_filters?.sub_issue || true,
      show_empty_groups: this.userFilters?.display_filters?.show_empty_groups || true,
      calendar_date_range: this.userFilters?.display_filters?.calendar_date_range || undefined,
      start_target_date: this.userFilters?.display_filters?.start_target_date || true,
    };

    // start date and target date we have to construct the format here
    // in calendar view calendar_date_range send as target_date
    // in spreadsheet sub issue is false for sure
    // in gantt start_target_date is true for sure

    let filteredParams: TIssueParams[] = [];
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
        "group_by",
        "order_by",
        "type",
        "sub_issue",
        "show_empty_groups",
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
        "sub_issue",
      ];
    if (_layout === "gantt_chart")
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
        "sub_issue",
        "start_target_date",
      ];

    filteredRouteParams = this.computedFilter(filteredRouteParams, filteredParams);

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
                show_empty_groups: issuesFiltersResponse?.view_props?.display_filters?.show_empty_groups ?? false,
                layout: issuesFiltersResponse?.view_props?.display_filters?.layout ?? "list",
                calendar_date_range: issuesFiltersResponse?.view_props?.display_filters?.calendar_date_range ?? false,
                start_target_date: issuesFiltersResponse?.view_props?.display_filters?.start_target_date ?? true,
              },
              display_properties: {
                assignee: issuesFiltersResponse?.view_props?.display_properties?.assignee ?? false,
                attachment_count: issuesFiltersResponse?.view_props?.display_properties?.attachment_count ?? false,
                created_on: issuesFiltersResponse?.view_props?.display_properties?.created_on ?? false,
                due_date: issuesFiltersResponse?.view_props?.display_properties?.due_date ?? false,
                estimate: issuesFiltersResponse?.view_props?.display_properties?.estimate ?? false,
                key: issuesFiltersResponse?.view_props?.display_properties?.key ?? false,
                labels: issuesFiltersResponse?.view_props?.display_properties?.labels ?? false,
                link: issuesFiltersResponse?.view_props?.display_properties?.link ?? false,
                priority: issuesFiltersResponse?.view_props?.display_properties?.priority ?? false,
                start_date: issuesFiltersResponse?.view_props?.display_properties?.start_date ?? false,
                state: issuesFiltersResponse?.view_props?.display_properties?.state ?? false,
                sub_issue_count: issuesFiltersResponse?.view_props?.display_properties?.sub_issue_count ?? false,
                updated_on: issuesFiltersResponse?.view_props?.display_properties?.updated_on ?? false,
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
  updateWorkspaceMyIssuesFilters = async (workspaceId: string, data: any) => {
    try {
      this.loader = true;
      this.error = null;

      const payload = {
        view_props: data,
      };
      const issuesFiltersResponse = await this.workspaceService.updateWorkspaceView(workspaceId, payload);

      if (issuesFiltersResponse) {
        runInAction(() => {
          this.loader = false;
          this.error = null;
        });
      }
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
                  ...this.issueRenderFilters?.workspace_properties?.[workspaceId]?.project_properties?.[projectId],
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
                  ...this.issueRenderFilters?.workspace_properties?.[workspaceId]?.project_properties?.[projectId],
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

      const issuesMembersResponse = await this.projectService.projectMembers(workspaceId, projectId);
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
                  ...this.issueRenderFilters?.workspace_properties?.[workspaceId]?.project_properties?.[projectId],
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

      const issuesDisplayPropertiesResponse = await this.issueService.getIssueProperties(workspaceId, projectId);

      if (issuesDisplayPropertiesResponse) {
        const _myUserId: string = issuesDisplayPropertiesResponse?.user;
        const _issuesDisplayPropertiesResponse: any = {
          ...this.issueFilters,
          [workspaceId]: {
            ...this?.issueFilters[workspaceId],
            project_issue_properties: {
              ...this?.issueFilters[workspaceId]?.project_issue_properties,
              [projectId]: {
                ...this?.issueFilters[workspaceId]?.project_issue_properties?.[projectId],
                display_properties_id: issuesDisplayPropertiesResponse?.id,
                display_properties: {
                  ...issuesDisplayPropertiesResponse?.properties,
                },
              },
            },
          },
        };

        runInAction(() => {
          this.myUserId = _myUserId;
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
  updateProjectDisplayProperties = async (
    workspaceId: string,
    projectId: string,
    display_properties_id: string,
    data: any
  ) => {
    try {
      this.loader = true;
      this.error = null;

      const payload = {
        properties: data,
        user: this.myUserId,
      };
      const issuesDisplayPropertiesResponse = await this.issueService.patchIssueProperties(
        workspaceId,
        projectId,
        display_properties_id,
        payload
      );

      if (issuesDisplayPropertiesResponse) {
        runInAction(() => {
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

      const issuesDisplayFiltersResponse = await this.projectService.projectMemberMe(workspaceId, projectId);

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

      return issuesDisplayFiltersResponse;
    } catch (error) {
      console.warn("error in fetching workspace level issue filters", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };
  updateProjectDisplayFilters = async (workspaceId: string, projectId: string, data: any) => {
    try {
      this.loader = true;
      this.error = null;

      const payload: any = {
        view_props: data,
      };
      const issuesFiltersResponse = await this.projectService.setProjectView(workspaceId, projectId, payload);

      if (issuesFiltersResponse) {
        runInAction(() => {
          this.loader = false;
          this.error = null;
        });
      }

      return issuesFiltersResponse;
    } catch (error) {
      this.getProjectDisplayFilters(workspaceId, projectId);
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
    } catch (error) {
      console.warn("error in fetching workspace level issue filters", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };

  getProjectIssueModuleFilters = async (workspaceId: string, projectId: string, moduleId: string) => {
    try {
      this.loader = true;
      this.error = null;

      await this.getProjectIssueFilters(workspaceId, projectId);

      const issuesFiltersModuleResponse = await this.moduleService.getModuleDetails(workspaceId, projectId, moduleId);

      if (issuesFiltersModuleResponse) {
        const _filters = { ...issuesFiltersModuleResponse?.view_props?.filters };
        const _issuesFiltersModuleResponse = {
          ...this.issueFilters,
          [workspaceId]: {
            ...this?.issueFilters[workspaceId],
            project_issue_properties: {
              ...this?.issueFilters[workspaceId]?.project_issue_properties,
              [projectId]: {
                ...this?.issueFilters[workspaceId]?.project_issue_properties?.[projectId],
                modules: {
                  ...this?.issueFilters[workspaceId]?.project_issue_properties?.[projectId]?.modules,
                  [moduleId]: {
                    ...this?.issueFilters[workspaceId]?.project_issue_properties?.[projectId]?.modules?.[moduleId],
                    filters: {
                      priority: _filters?.priority ?? undefined,
                      state: _filters?.state ?? undefined,
                      state_group: _filters?.state_group ?? undefined,
                      assignees: _filters?.assignees ?? undefined,
                      created_by: _filters?.created_by ?? undefined,
                      labels: _filters?.labels ?? undefined,
                      start_date: _filters?.start_date ?? undefined,
                      target_date: _filters?.target_date ?? undefined,
                    },
                  },
                },
              },
            },
          },
        };

        runInAction(() => {
          this.issueFilters = _issuesFiltersModuleResponse as any;
          this.loader = false;
          this.error = null;
        });
      }
    } catch (error) {
      console.warn("error in fetching workspace level issue filters", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };
  updateProjectIssueModuleFilters = async (workspaceId: string, projectId: string, moduleId: string, data: any) => {
    try {
      this.loader = true;
      this.error = null;

      const payload = {
        view_props: { filters: data },
      };
      const issuesFiltersModuleResponse = await this.moduleService.patchModule(
        workspaceId,
        projectId,
        moduleId,
        payload,
        undefined // TODO: replace this with user
      );

      if (issuesFiltersModuleResponse) {
        runInAction(() => {
          this.loader = false;
          this.error = null;
        });
      }
    } catch (error) {
      this.getProjectIssueModuleFilters(workspaceId, projectId, moduleId);
      console.warn("error in fetching workspace level issue filters", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };

  getProjectIssueCyclesFilters = async (workspaceId: string, projectId: string, cycleId: string) => {
    try {
      this.loader = true;
      this.error = null;

      await this.getProjectIssueFilters(workspaceId, projectId);

      const issuesFiltersCycleResponse = await this.cycleService.getCycleDetails(workspaceId, projectId, cycleId);

      if (issuesFiltersCycleResponse) {
        const _filters = { ...issuesFiltersCycleResponse?.view_props?.filters };
        const _issuesFiltersCycleResponse = {
          ...this.issueFilters,
          [workspaceId]: {
            ...this?.issueFilters[workspaceId],
            project_issue_properties: {
              ...this?.issueFilters[workspaceId]?.project_issue_properties,
              [projectId]: {
                ...this?.issueFilters[workspaceId]?.project_issue_properties?.[projectId],
                cycles: {
                  ...this?.issueFilters[workspaceId]?.project_issue_properties?.[projectId]?.cycles,
                  [cycleId]: {
                    ...this?.issueFilters[workspaceId]?.project_issue_properties?.[projectId]?.modules?.[cycleId],
                    filters: {
                      priority: _filters?.priority ?? undefined,
                      state: _filters?.state ?? undefined,
                      state_group: _filters?.state_group ?? undefined,
                      assignees: _filters?.assignees ?? undefined,
                      created_by: _filters?.created_by ?? undefined,
                      labels: _filters?.labels ?? undefined,
                      start_date: _filters?.start_date ?? undefined,
                      target_date: _filters?.target_date ?? undefined,
                    },
                  },
                },
              },
            },
          },
        };

        runInAction(() => {
          this.issueFilters = _issuesFiltersCycleResponse as any;
          this.loader = false;
          this.error = null;
        });
      }
    } catch (error) {
      console.warn("error in fetching workspace level issue filters", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };
  updateProjectIssueCyclesFilters = async (workspaceId: string, projectId: string, cycleId: string, data: any) => {
    try {
      this.loader = true;
      this.error = null;

      const payload = {
        view_props: { filters: data },
      };
      const issuesFiltersCycleResponse = await this.cycleService.patchCycle(
        workspaceId,
        projectId,
        cycleId,
        payload,
        undefined // TODO: replace this with user
      );

      if (issuesFiltersCycleResponse) {
        runInAction(() => {
          this.loader = false;
          this.error = null;
        });
      }
    } catch (error) {
      this.getProjectIssueCyclesFilters(workspaceId, projectId, cycleId);
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

      await this.getProjectIssueFilters(workspaceId, projectId);

      const issuesFiltersViewResponse = await this.viewService.getViewDetails(workspaceId, projectId, viewId);

      if (issuesFiltersViewResponse) {
        const _filters = { ...issuesFiltersViewResponse?.query_data } as any;
        const _issuesFiltersViewResponse = {
          ...this.issueFilters,
          [workspaceId]: {
            ...this?.issueFilters[workspaceId],
            project_issue_properties: {
              ...this?.issueFilters[workspaceId]?.project_issue_properties,
              [projectId]: {
                ...this?.issueFilters[workspaceId]?.project_issue_properties?.[projectId],
                views: {
                  ...this?.issueFilters[workspaceId]?.project_issue_properties?.[projectId]?.cycles,
                  [viewId]: {
                    ...this?.issueFilters[workspaceId]?.project_issue_properties?.[projectId]?.modules?.[viewId],
                    filters: {
                      priority: _filters?.priority ?? undefined,
                      state: _filters?.state ?? undefined,
                      state_group: _filters?.state_group ?? undefined,
                      assignees: _filters?.assignees ?? undefined,
                      created_by: _filters?.created_by ?? undefined,
                      labels: _filters?.labels ?? undefined,
                      start_date: _filters?.start_date ?? undefined,
                      target_date: _filters?.target_date ?? undefined,
                    },
                  },
                },
              },
            },
          },
        };

        runInAction(() => {
          this.issueFilters = _issuesFiltersViewResponse as any;
          this.loader = false;
          this.error = null;
        });
      }
    } catch (error) {
      console.warn("error in fetching workspace level issue filters", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };
  updateProjectIssueViewsFilters = async (workspaceId: string, projectId: string, viewId: string, data: any) => {
    try {
      this.loader = true;
      this.error = null;

      const payload = {
        query_data: data,
      };
      const issuesFiltersViewResponse = await this.viewService.patchView(
        workspaceId,
        projectId,
        viewId,
        payload,
        undefined // TODO: replace this with user
      );

      if (issuesFiltersViewResponse) {
        runInAction(() => {
          this.loader = false;
          this.error = null;
        });
      }

      return issuesFiltersViewResponse;
    } catch (error) {
      this.getProjectIssueViewsFilters(projectId, workspaceId, viewId);
      console.warn("error in fetching workspace level issue filters", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };
}

export default IssueFilterStore;

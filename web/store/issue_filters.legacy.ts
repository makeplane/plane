import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";
// services
import { WorkspaceService } from "services/workspace.service";
import { ProjectIssuesServices } from "services/issue.service";
import { ProjectStateServices } from "services/project_state.service";
import { ProjectServices } from "services/project.service";
import { ProjectIssuesServices as ProjectModuleServices } from "services/modules.service";
import { ProjectCycleServices } from "services/cycles.service";
import { ViewService } from "services/views.service";
// default data
import {
  priorities,
  stateGroups,
  startDateOptions,
  dueDateOptions,
  groupByOptions,
  orderByOptions,
  issueTypes,
  displayProperties,
  extraProperties,
  handleIssueQueryParamsByLayout,
} from "./helpers/issue-data";

export type TIssueViews = "issues" | "modules" | "views" | "cycles";
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
  state_group: string[] | undefined;
  state: string[] | undefined;
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

export interface IIssueFilters {
  // project_id
  [key: string]: {
    issues: {
      // project_id
      [key: string]: {
        filters: IIssueFilter;
      };
    };
    cycles: {
      // cycle_id
      [key: string]: {
        filters: IIssueFilter;
      };
    };
    modules: {
      // module_id
      [key: string]: {
        filters: IIssueFilter;
      };
    };
    views: {
      // view_id
      [key: string]: {
        filters: IIssueFilter;
      };
    };
    display_filters: IIssueDisplayFilters;
    display_properties_id: string;
    display_properties: IIssueDisplayProperties;
  };
}

export interface IIssueFilterStore {
  // static data
  priorities: { key: string; title: string }[];
  stateGroups: { key: string; title: string }[];
  startDateOptions: { key: string; title: string }[];
  dueDateOptions: { key: string; title: string }[];
  groupByOptions: { key: string; title: string }[];
  orderByOptions: { key: string; title: string }[];
  issueTypes: { key: string; title: string }[];
  displayProperties: { key: string; title: string }[];
  extraProperties: { key: string; title: string }[];

  loader: boolean;
  error: any | null;

  // current workspace and project id
  issueView: TIssueViews | null;
  issueFilters: IIssueFilters;

  // actions
  // getWorkspaceMyIssuesFilters: (workspaceId: string) => Promise<any>;
  // updateWorkspaceMyIssuesFilters: (workspaceId: string, data: any) => Promise<any>;

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
  // static data
  priorities: { key: string; title: string }[] = priorities;
  stateGroups: { key: string; title: string }[] = stateGroups;
  startDateOptions: { key: string; title: string }[] = startDateOptions;
  dueDateOptions: { key: string; title: string }[] = dueDateOptions;
  groupByOptions: { key: string; title: string }[] = groupByOptions;
  orderByOptions: { key: string; title: string }[] = orderByOptions;
  issueTypes: { key: string; title: string }[] = issueTypes;
  displayProperties: { key: string; title: string }[] = displayProperties;
  extraProperties: { key: string; title: string }[] = extraProperties;

  loader: boolean = false;
  error: any | null = null;

  // workspaceId: string | null = null;
  // projectId: string | null = null;
  // moduleId: string | null = null;
  // cycleId: string | null = null;
  // viewId: string | null = null;

  issueView: TIssueViews | null = null;

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

      issueView: observable,

      issueFilters: observable.ref,

      // computed
      issueLayout: computed,
      projectDisplayProperties: computed,
      userFilters: computed,

      // actions
      getComputedFilters: action,

      handleUserFilter: action,

      // getWorkspaceMyIssuesFilters: action,
      // updateWorkspaceMyIssuesFilters: action,

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
    this.viewService = new ViewService();
  }

  // computed
  get issueLayout() {
    // if (!this.projectId) return null;
    // if (!this.projectId)
    //   return this.issueFilters?.[this.workspaceId]?.my_issue_properties?.display_filters?.layout || null;
    // if (this.projectId)
    //   return (
    //     this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.issues?.display_filters
    //       ?.layout || null
    //   );

    return null;
  }

  get projectDisplayProperties() {
    // if (!this.workspaceId || !this.projectId) return null;
    // return this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.display_properties as any;

    return null;
  }

  get userFilters() {
    if (!this.projectId) return null;
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
    // if (!this.workspaceId) return null;
    // if (this.issueView === "my_issues") {
    //   this.issueFilters = {
    //     ...this.issueFilters,
    //     [this.workspaceId]: {
    //       ...this.issueFilters?.[this.workspaceId],
    //       my_issue_properties: {
    //         ...this.issueFilters?.[this.workspaceId]?.my_issue_properties,
    //         [filter_type]: {
    //           ...this.issueFilters?.[this.workspaceId]?.my_issue_properties?.[filter_type],
    //           [filter_key]: value,
    //         },
    //       },
    //     },
    //   };
    //   this.updateWorkspaceMyIssuesFilters(this.workspaceId, this.userFilters);
    // }
    // if (!this.projectId) return null;
    // if (filter_type === "display_properties") {
    //   this.issueFilters = {
    //     ...this.issueFilters,
    //     [this.workspaceId]: {
    //       ...this.issueFilters?.[this.workspaceId],
    //       project_issue_properties: {
    //         ...this.issueFilters?.[this.workspaceId]?.project_issue_properties,
    //         [this.projectId]: {
    //           ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId],
    //           display_properties: {
    //             ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]
    //               ?.display_properties,
    //             [filter_key]: value,
    //           },
    //         },
    //       },
    //     },
    //   };
    //   if (this.userFilters?.display_properties_id) {
    //     this.updateProjectDisplayProperties(
    //       this.workspaceId,
    //       this.projectId,
    //       this.userFilters?.display_properties_id,
    //       this.userFilters?.display_properties
    //     );
    //   }
    // }
    // if (filter_type === "display_filters") {
    //   this.issueFilters = {
    //     ...this.issueFilters,
    //     [this.workspaceId]: {
    //       ...this.issueFilters?.[this.workspaceId],
    //       project_issue_properties: {
    //         ...this.issueFilters?.[this.workspaceId]?.project_issue_properties,
    //         [this.projectId]: {
    //           ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId],
    //           issues: {
    //             ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.issues,
    //             [filter_type]: {
    //               ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.issues?.[
    //                 filter_type
    //               ],
    //               [filter_key]: value,
    //             },
    //           },
    //         },
    //       },
    //     },
    //   };
    //   this.updateProjectDisplayFilters(this.workspaceId, this.projectId, {
    //     filters: this.userFilters?.filters,
    //     display_filters: this.userFilters?.display_filters,
    //   });
    // }
    // if (filter_type === "filters") {
    //   if (this.issueView === "issues") {
    //     this.issueFilters = {
    //       ...this.issueFilters,
    //       [this.workspaceId]: {
    //         ...this.issueFilters?.[this.workspaceId],
    //         project_issue_properties: {
    //           ...this.issueFilters?.[this.workspaceId]?.project_issue_properties,
    //           [this.projectId]: {
    //             ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId],
    //             issues: {
    //               ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.issues,
    //               [filter_type]: {
    //                 ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.issues?.[
    //                   filter_type
    //                 ],
    //                 [filter_key]: value,
    //               },
    //             },
    //           },
    //         },
    //       },
    //     };
    //     this.updateProjectDisplayFilters(this.workspaceId, this.projectId, {
    //       filters: this.userFilters?.filters,
    //       display_filters: this.userFilters?.display_filters,
    //     });
    //   }
    //   if (this.issueView === "modules" && this.moduleId) {
    //     this.issueFilters = {
    //       ...this.issueFilters,
    //       [this.workspaceId]: {
    //         ...this.issueFilters?.[this.workspaceId],
    //         project_issue_properties: {
    //           ...this.issueFilters?.[this.workspaceId]?.project_issue_properties,
    //           [this.projectId]: {
    //             ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId],
    //             modules: {
    //               ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.modules,
    //               [this.moduleId]: {
    //                 ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.modules?.[
    //                   this.moduleId
    //                 ],
    //                 [filter_type]: {
    //                   ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.modules?.[
    //                     this.moduleId
    //                   ]?.[filter_type],
    //                   [filter_key]: value,
    //                 },
    //               },
    //             },
    //           },
    //         },
    //       },
    //     };
    //     this.updateProjectIssueModuleFilters(
    //       this.workspaceId,
    //       this.projectId,
    //       this.moduleId,
    //       this.userFilters?.filters
    //     );
    //   }
    //   if (this.issueView === "cycles" && this.cycleId) {
    //     this.issueFilters = {
    //       ...this.issueFilters,
    //       [this.workspaceId]: {
    //         ...this.issueFilters?.[this.workspaceId],
    //         project_issue_properties: {
    //           ...this.issueFilters?.[this.workspaceId]?.project_issue_properties,
    //           [this.projectId]: {
    //             ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId],
    //             cycles: {
    //               ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.cycles,
    //               [this.cycleId]: {
    //                 ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.cycles?.[
    //                   this.cycleId
    //                 ],
    //                 [filter_type]: {
    //                   ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.cycles?.[
    //                     this.cycleId
    //                   ]?.[filter_type],
    //                   [filter_key]: value,
    //                 },
    //               },
    //             },
    //           },
    //         },
    //       },
    //     };
    //     this.updateProjectIssueCyclesFilters(this.workspaceId, this.projectId, this.cycleId, this.userFilters?.filters);
    //   }
    //   if (this.issueView === "views" && this.viewId) {
    //     this.issueFilters = {
    //       ...this.issueFilters,
    //       [this.workspaceId]: {
    //         ...this.issueFilters?.[this.workspaceId],
    //         project_issue_properties: {
    //           ...this.issueFilters?.[this.workspaceId]?.project_issue_properties,
    //           [this.projectId]: {
    //             ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId],
    //             views: {
    //               ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.views,
    //               [this.viewId]: {
    //                 ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.views?.[
    //                   this.viewId
    //                 ],
    //                 [filter_type]: {
    //                   ...this.issueFilters?.[this.workspaceId]?.project_issue_properties?.[this.projectId]?.views?.[
    //                     this.viewId
    //                   ]?.[filter_type],
    //                   [filter_key]: value,
    //                 },
    //               },
    //             },
    //           },
    //         },
    //       },
    //     };
    //     this.updateProjectIssueViewsFilters(this.workspaceId, this.projectId, this.viewId, this.userFilters?.filters);
    //   }
    // }
    // if (this.issueView === "my_issues")
    //   this.rootStore?.issueView?.getProjectIssuesAsync(this.workspaceId, this.projectId, false);
    // if (this.issueView === "issues")
    //   this.rootStore?.issueView?.getProjectIssuesAsync(this.workspaceId, this.projectId, false);
    // if (this.issueView === "modules" && this.moduleId)
    //   this.rootStore?.issueView?.getIssuesForModulesAsync(this.workspaceId, this.projectId, this.moduleId, false);
    // if (this.issueView === "cycles" && this.cycleId)
    //   this.rootStore?.issueView?.getIssuesForCyclesAsync(this.workspaceId, this.projectId, this.cycleId, false);
    // if (this.issueView === "views" && this.viewId)
    //   this.rootStore?.issueView?.getIssuesForViewsAsync(this.workspaceId, this.projectId, this.viewId, false);
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
    this.issueView = _issueView;

    // const _layout = this.userFilters?.display_filters?.layout;
    const _layout = "";

    let filteredRouteParams: any = {
      // priority: this.userFilters?.filters?.priority || undefined,
      // state_group: this.userFilters?.filters?.state_group || undefined,
      // state: this.userFilters?.filters?.state || undefined,
      // assignees: this.userFilters?.filters?.assignees || undefined,
      // created_by: this.userFilters?.filters?.created_by || undefined,
      // labels: this.userFilters?.filters?.labels || undefined,
      // start_date: this.userFilters?.filters?.start_date || undefined,
      // target_date: this.userFilters?.filters?.target_date || undefined,
      // group_by: this.userFilters?.display_filters?.group_by || "state",
      // order_by: this.userFilters?.display_filters?.order_by || "-created_at",
      // type: this.userFilters?.display_filters?.type || undefined,
      // sub_issue: this.userFilters?.display_filters?.sub_issue || true,
      // show_empty_groups: this.userFilters?.display_filters?.show_empty_groups || true,
      // calendar_date_range: this.userFilters?.display_filters?.calendar_date_range || undefined,
      // start_target_date: this.userFilters?.display_filters?.start_target_date || true,
    };

    // start date and target date we have to construct the format here
    // in calendar view calendar_date_range send as target_date
    // in spreadsheet sub issue is false for sure
    // in gantt start_target_date is true for sure

    const filteredParams: TIssueParams[] | null = handleIssueQueryParamsByLayout(_layout);
    if (filteredParams) filteredRouteParams = this.computedFilter(filteredRouteParams, filteredParams);

    return filteredRouteParams;
  };

  handleIssueFilter = (
    filter_type: "filters" | "display_filters" | "display_properties" | "display_properties_id",
    value: any
  ) => {
    const projectId = this.rootStore?.project?.projectId || null;
    const moduleId = this.rootStore?.module?.moduleId || null;
    const cycleId = this.rootStore?.cycle?.cycleId || null;
    const viewId = this.rootStore?.view?.viewId || null;
    const currentView = this.issueView || null;

    console.log("filter_type", filter_type);
    console.log("value", value);

    if (!currentView || !projectId || !moduleId || !cycleId || !viewId) return null;

    // let _issueFilters: IIssueFilters = {
    //   ...this.issueFilters,
    //   [workspaceId]: {
    //     ...this.issueFilters?.[workspaceId],
    //   },
    // };

    // console.log("_issueFilters", _issueFilters);
  };

  // services
  // getWorkspaceMyIssuesFilters = async (workspaceId: string) => {
  //   try {
  //     this.loader = true;
  //     this.error = null;

  //     const issuesFiltersResponse = await this.workspaceService.workspaceMemberMe(workspaceId);
  //     if (issuesFiltersResponse) {
  //       const _issuesFiltersResponse: any = {
  //         ...this.issueFilters,
  //         [workspaceId]: {
  //           ...this?.issueFilters?.[workspaceId],
  //           my_issue_properties: {
  //             ...this?.issueFilters?.[workspaceId]?.my_issue_properties,
  //             filters: {
  //               priority: issuesFiltersResponse?.view_props?.filters?.priority ?? null,
  //               state: issuesFiltersResponse?.view_props?.filters?.state ?? null,
  //               state_group: issuesFiltersResponse?.view_props?.filters?.state_group ?? null,
  //               assignees: issuesFiltersResponse?.view_props?.filters?.assignees ?? null,
  //               created_by: issuesFiltersResponse?.view_props?.filters?.created_by ?? null,
  //               labels: issuesFiltersResponse?.view_props?.filters?.labels ?? null,
  //               start_date: issuesFiltersResponse?.view_props?.filters?.start_date ?? null,
  //               target_date: issuesFiltersResponse?.view_props?.filters?.target_date ?? null,
  //               subscriber: issuesFiltersResponse?.view_props?.filters?.subscriber ?? null,
  //             },
  //             display_filters: {
  //               group_by: issuesFiltersResponse?.view_props?.display_filters?.group_by ?? null,
  //               order_by: issuesFiltersResponse?.view_props?.display_filters?.order_by ?? null,
  //               type: issuesFiltersResponse?.view_props?.display_filters?.type ?? null,
  //               sub_issue: issuesFiltersResponse?.view_props?.display_filters?.sub_issue ?? false,
  //               show_empty_groups: issuesFiltersResponse?.view_props?.display_filters?.show_empty_groups ?? false,
  //               layout: issuesFiltersResponse?.view_props?.display_filters?.layout ?? "list",
  //               calendar_date_range: issuesFiltersResponse?.view_props?.display_filters?.calendar_date_range ?? false,
  //               start_target_date: issuesFiltersResponse?.view_props?.display_filters?.start_target_date ?? true,
  //             },
  //             display_properties: {
  //               assignee: issuesFiltersResponse?.view_props?.display_properties?.assignee ?? false,
  //               attachment_count: issuesFiltersResponse?.view_props?.display_properties?.attachment_count ?? false,
  //               created_on: issuesFiltersResponse?.view_props?.display_properties?.created_on ?? false,
  //               due_date: issuesFiltersResponse?.view_props?.display_properties?.due_date ?? false,
  //               estimate: issuesFiltersResponse?.view_props?.display_properties?.estimate ?? false,
  //               key: issuesFiltersResponse?.view_props?.display_properties?.key ?? false,
  //               labels: issuesFiltersResponse?.view_props?.display_properties?.labels ?? false,
  //               link: issuesFiltersResponse?.view_props?.display_properties?.link ?? false,
  //               priority: issuesFiltersResponse?.view_props?.display_properties?.priority ?? false,
  //               start_date: issuesFiltersResponse?.view_props?.display_properties?.start_date ?? false,
  //               state: issuesFiltersResponse?.view_props?.display_properties?.state ?? false,
  //               sub_issue_count: issuesFiltersResponse?.view_props?.display_properties?.sub_issue_count ?? false,
  //               updated_on: issuesFiltersResponse?.view_props?.display_properties?.updated_on ?? false,
  //             },
  //           },
  //         },
  //       };
  //       runInAction(() => {
  //         this.issueFilters = _issuesFiltersResponse;
  //         this.loader = false;
  //         this.error = null;
  //       });
  //     }
  //     return issuesFiltersResponse;
  //   } catch (error) {
  //     console.warn("error in fetching workspace level filters", error);
  //     this.loader = false;
  //     this.error = null;
  //
  //   }
  // };
  // updateWorkspaceMyIssuesFilters = async (workspaceId: string, data: any) => {
  //   try {
  //     this.loader = true;
  //     this.error = null;

  //     const payload = {
  //       view_props: data,
  //     };
  //     const issuesFiltersResponse = await this.workspaceService.updateWorkspaceView(workspaceId, payload);

  //     if (issuesFiltersResponse) {
  //       runInAction(() => {
  //         this.loader = false;
  //         this.error = null;
  //       });
  //     }
  //   } catch (error) {
  //     console.warn("error in fetching workspace level issue filters", error);
  //     this.loader = false;
  //     this.error = null;
  //
  //   }
  // };

  getProjectDisplayProperties = async (workspaceId: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      await this.rootStore.user.setCurrentUser();
      const issuesDisplayPropertiesResponse = await this.issueService.getIssueProperties(workspaceId, projectId);

      if (issuesDisplayPropertiesResponse) {
        const _issuesDisplayPropertiesResponse: any = {
          ...this.issueFilters,
          [projectId]: {
            ...this?.issueFilters?.[projectId],
            display_properties_id: issuesDisplayPropertiesResponse?.id,
            display_properties: {
              ...issuesDisplayPropertiesResponse?.properties,
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
        user: this.rootStore?.user?.currentUser?.id,
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
          [projectId]: {
            ...this?.issueFilters?.[projectId],
            issues: {
              ...this?.issueFilters?.[projectId]?.issues,
              filters: _filters,
            },
            display_filters: _displayFilters,
          },
        };

        console.log("_issuesDisplayFiltersResponse", _issuesDisplayFiltersResponse);

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
    }
  };

  getProjectIssueFilters = async (workspaceId: string, projectId: string) => {
    try {
      await this.getProjectDisplayProperties(workspaceId, projectId);
      await this.getProjectDisplayFilters(workspaceId, projectId);
    } catch (error) {
      console.warn("error in fetching workspace level issue filters", error);
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
          [projectId]: {
            ...this?.issueFilters?.[projectId],
            modules: {
              ...this?.issueFilters?.[projectId]?.modules,
              [moduleId]: {
                ...this?.issueFilters?.[projectId]?.modules?.[moduleId],
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
          [projectId]: {
            ...this?.issueFilters?.[projectId],
            cycles: {
              ...this?.issueFilters?.[projectId]?.cycles,
              [cycleId]: {
                ...this?.issueFilters?.[projectId]?.modules?.[cycleId],
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
          [projectId]: {
            ...this?.issueFilters?.[projectId],
            views: {
              ...this?.issueFilters?.[projectId]?.views,
              [viewId]: {
                ...this?.issueFilters?.[projectId]?.modules?.[viewId],
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
      console.warn("error in fetching workspace level issue filters", error);
      this.loader = false;
      this.error = null;
    }
  };
}

export default IssueFilterStore;

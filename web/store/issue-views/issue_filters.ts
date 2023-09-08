import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "../root";
// services
import {} from "services/issues.service";
// default data
import {
  filtersPriority,
  filtersStartDate,
  filtersDueDate,
  displayPropertyGroupBy,
  displayPropertyOrderBy,
  displayPropertyIssueType,
  displayProperties,
} from "./issue_data";

export type TIssueViews = "my_issues" | "issues" | "modules" | "views" | "cycles";
export type TIssueLayouts = "list" | "kanban" | "calendar" | "spreadsheet" | "gantt";

export interface IIssueFilterStore {
  loader: boolean;
  error: any | null;

  // current workspace and project id
  workspaceId: string | null;
  projectId: string | null;
  moduleId: string | null;
  cycleId: string | null;
  viewId: string | null;
  // current issue layout:TIssueLayouts and view:TIssueViews
  issueView: TIssueViews | null;
  issueLayout: TIssueLayouts | null;

  // filters
  // static filters data
  priority: { key: string; title: string }[];
  startDate: { key: string; title: string }[];
  dueDate: { key: string; title: string }[];
  issueType: { key: string; title: string }[];

  // static display filters data
  groupBy: { key: string; title: string }[];
  orderBy: { key: string; title: string }[];

  // dynamic filters data
  state: { [key: string]: { key: string; title: string }[] } | null;
  members: { [key: string]: { key: string; title: string }[] } | null; // members are used for both assignees and crated_by
  labels: { [key: string]: { key: string; title: string }[] } | null;

  userSelectedFilters: {
    priority: string[] | null;
    state: string[] | null;
    assignees: string[] | null;
    created_by: string[] | null;
    labels: string[] | null;
    start_date: string[] | null;
    target_date: string[] | null;
    type: string;
  };

  userSelectedDisplayFilters?: {
    group_by: undefined | string;
    order_by: undefined | string;
    sub_issue: boolean;
    showEmptyGroups: boolean;
  };

  // static display properties data
  displayProperties?: { key: string; title: string }[] | null;
  userSelectedDisplayProperties?: {
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
  };

  // actions
  getProjectIssueFilterProperties: () => any | Promise<any>;
  getProjectIssueDisplayProperties: () => any | Promise<any>;
  getProjectMembers: () => any | Promise<any>;
  getProjectStates: () => any | Promise<any>;
  getProjectLabels: () => any | Promise<any>;
}

class IssueFilterStore implements IIssueFilterStore {
  loader: boolean = false;
  error: any | null = null;

  workspaceId: string | null = null;
  projectId: string | null = null;
  moduleId: string | null = null;
  cycleId: string | null = null;
  viewId: string | null = null;

  issueLayout: TIssueLayouts | null = null;
  issueView: TIssueViews | null = null;

  priority: { key: string; title: string }[] = filtersPriority;
  startDate: { key: string; title: string }[] = filtersStartDate;
  dueDate: { key: string; title: string }[] = filtersDueDate;
  issueType: { key: string; title: string }[] = displayPropertyIssueType;

  // static display filters data
  groupBy: { key: string; title: string }[] = displayPropertyGroupBy;
  orderBy: { key: string; title: string }[] = displayPropertyOrderBy;

  state: { [key: string]: { key: string; title: string }[] } | null = null;
  members: { [key: string]: { key: string; title: string }[] } | null = null;
  labels: { [key: string]: { key: string; title: string }[] } | null = null;

  userSelectedFilters: {
    priority: string[] | null;
    state: string[] | null;
    assignees: string[] | null;
    created_by: string[] | null;
    labels: string[] | null;
    start_date: string[] | null;
    target_date: string[] | null;
    type: string;
  } = {
    priority: null,
    state: null,
    assignees: null,
    created_by: null,
    labels: null,
    start_date: null,
    target_date: null,
    type: "all",
  };

  // root store
  rootStore;
  // service
  projectPublishService = null;

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

      issueLayout: observable,
      issueView: observable,

      state: observable.ref,
      members: observable.ref,
      labels: observable.ref,

      userSelectedFilters: observable.ref,

      // action
      setWorkspaceId: action,
      setProjectId: action,
      setModuleId: action,
      setCycleId: action,
      setViewId: action,

      setIssueLayout: action,
      setIssueView: action,

      getProjectIssueFilterProperties: action,
      getProjectIssueDisplayProperties: action,
      getProjectMembers: action,
      getProjectStates: action,
      getProjectLabels: action,
      // computed
    });

    this.rootStore = _rootStore;
    this.projectPublishService = null;
  }

  setWorkspaceId = (_workspaceId: string | null) => (this.workspaceId = _workspaceId);
  setProjectId = (_projectId: string | null) => (this.projectId = _projectId);
  setModuleId = (_moduleId: string | null) => (this.moduleId = _moduleId);
  setCycleId = (_cycleId: string | null) => (this.cycleId = _cycleId);
  setViewId = (_viewId: string | null) => (this.viewId = _viewId);
  setIssueLayout = (_layout: TIssueLayouts | null) => (this.issueLayout = _layout);
  setIssueView = (_view: TIssueViews | null) => (this.issueView = _view);

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

  // computed functions starts
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
    this.setIssueLayout(_issueLayout);

    let filteredRouteParams: any = {
      priority: this.userSelectedFilters?.priority || undefined,
      state: this.userSelectedFilters?.state || undefined,
      assignees: this.userSelectedFilters?.assignees || undefined, // ['user_id', 'user_id']
      created_by: this.userSelectedFilters?.created_by || undefined, // ['user_id', 'user_id']
      labels: this.userSelectedFilters?.labels || undefined, // ['label_id', 'label_id']
      start_date: this.userSelectedFilters?.start_date || undefined, // ['yyyy-mm-dd:after/before', 'yyyy-mm-dd:after/before']
      target_date: this.userSelectedFilters?.target_date || undefined, // [yyyy-mm-dd:after, yyyy-mm-dd:before]
      type: this.userSelectedFilters?.type || undefined, // 'active' (started, un_started) || 'backlog' || 'null' (all_the_issues)
      group_by: "state", // TIssueGroupByOptions
      order_by: "-created_at", // TIssueOrderByOptions
      sub_issue: true, // true for all other views except spreadsheet
    };

    let filteredParams: any = {};

    if (this.issueLayout === "list")
      filteredParams = [
        "priority",
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
    if (this.issueLayout === "kanban")
      filteredParams = [
        "priority",
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
    if (this.issueLayout === "calendar")
      filteredParams = [
        "priority",
        "state",
        "assignees",
        "created_by",
        "labels",
        "start_date",
        "target_date",
        "type",
      ];
    if (this.issueLayout === "spreadsheet")
      filteredParams = [
        "priority",
        "state",
        "assignees",
        "created_by",
        "labels",
        "start_date",
        "target_date",
        "type",
      ];
    if (this.issueLayout === "gantt")
      filteredParams = [
        "priority",
        "state",
        "assignees",
        "created_by",
        "labels",
        "start_date",
        "target_date",
        "type",
        "order_by",
        "sub_issue_id",
      ];

    filteredRouteParams = this.computedFilter(filteredRouteParams, filteredParams);

    return filteredRouteParams;
  };

  // computed functions ends

  // fetching current user project issue filter and display settings
  getProjectIssueFilterProperties = () => {};

  // fetching display properties
  getProjectIssueDisplayProperties = () => {};

  // fetching project members
  getProjectMembers = () => {};

  // fetching project state <-> groups
  getProjectStates = () => {};

  // fetching project labels
  getProjectLabels = () => {};
}

export default IssueFilterStore;

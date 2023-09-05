import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "../root";
// services
import {} from "services/issues.service";

export type TIssueViews = "list" | "kanban" | "calendar" | "spreadsheet" | "gantt";

export interface IIssueFilterStore {
  loader: boolean;
  error: any | null;

  // current issue view
  workspaceId: string | null;
  projectId: string | null;
  issueView: string | null;

  // filters
  priority?: null;
  state?: null;
  assignees?: null;
  createdBy?: null;
  labels?: null;
  startDate?: null;
  dueDate?: null;
  userSelectedParams?: {
    assignees: undefined | string;
    created_by: undefined | string;
    group_by: undefined | string;
    labels: undefined | string;
    order_by: undefined | string;
    priority: undefined | string;
    start_date: undefined | string;
    state: undefined | string;
    sub_issue: boolean;
    target_date: undefined | string;
    type: undefined | string;
  };

  // display properties
  displayProperties?: {
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

  // extra's
  showEmptyGroups?: boolean;

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
  issueView: string | null = null;

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

      // action
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

  // computed functions starts
  getComputedFilters = (
    _workspaceId: string,
    _projectId: string,
    _view: TIssueViews | null = "kanban"
  ) => {
    this.workspaceId = _workspaceId;
    this.projectId = _projectId;
    this.issueView = _view;

    let filteredRouteParams = {
      assignees: undefined, // ['user_id', 'user_id']
      state: undefined, // ['state_id', 'state_id']
      priority: undefined, // ['low', 'high', 'medium', 'urgent', 'null']
      type: undefined, // 'active' (started, un_started) || 'backlog' || 'null' (all_the_issues)
      labels: undefined, // ['label_id', 'label_id']
      created_by: undefined, // ['user_id', 'user_id']
      start_date: undefined, // ['yyyy-mm-dd:after/before', 'yyyy-mm-dd:after/before']
      target_date: undefined, // [yyyy-mm-dd:after, yyyy-mm-dd:before]
      order_by: "-created_at", // TIssueOrderByOptions
      group_by: "state", // TIssueGroupByOptions
      sub_issue: true, // true for all other views except spreadsheet
    };

    if (_view === "list") filteredRouteParams = { ...filteredRouteParams };
    if (_view === "kanban") filteredRouteParams = { ...filteredRouteParams };
    if (_view === "calendar") filteredRouteParams = { ...filteredRouteParams };
    if (_view === "spreadsheet") filteredRouteParams = { ...filteredRouteParams };
    if (_view === "gantt") filteredRouteParams = { ...filteredRouteParams };

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

import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";
// services

export interface IKanbanStore {
  loader: boolean;
  error: any | null;

  // current issue view
  issueView?: "kanban";

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

  issues?: null;
}

class KanbanStore implements IKanbanStore {
  loader: boolean = false;
  error: any | null = null;

  // root store
  rootStore;
  // service
  projectPublishService = null;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable,
      error: observable,

      // action
      // computed
    });

    this.rootStore = _rootStore;
    this.projectPublishService = null;
  }
}

export default KanbanStore;

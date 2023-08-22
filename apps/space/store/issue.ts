// mobx
import { observable, action, computed, makeObservable, runInAction } from "mobx";
// service
import IssueService from "services/issue.service";
// types
import { TIssueBoardKeys } from "store/types/issue";
import { IIssueStore, IIssue, IIssueState, IIssueLabel } from "./types";

class IssueStore implements IIssueStore {
  currentIssueBoardView: TIssueBoardKeys | null = null;

  loader: boolean = false;
  error: any | null = null;

  states: IIssueState[] | null = null;
  labels: IIssueLabel[] | null = null;
  issues: IIssue[] | null = null;

  userSelectedStates: string[] = [];
  userSelectedLabels: string[] = [];
  userSelectedPriorities: string[] = [];
  // root store
  rootStore;
  // service
  issueService;

  constructor(_rootStore: any) {
    makeObservable(this, {
      // observable
      currentIssueBoardView: observable,

      loader: observable,
      error: observable,

      states: observable.ref,
      labels: observable.ref,
      issues: observable.ref,

      userSelectedStates: observable.ref,
      userSelectedLabels: observable.ref,
      userSelectedPriorities: observable.ref,
      // action
      setCurrentIssueBoardView: action,
      getIssuesAsync: action,
      // computed
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueService();
  }

  // computed
  getCountOfIssuesByState(state_id: string): number {
    return this.issues?.filter((issue) => issue.state == state_id).length || 0;
  }

  getFilteredIssuesByState(state_id: string): IIssue[] | [] {
    return this.issues?.filter((issue) => issue.state == state_id) || [];
  }

  /**
   *
   * @param key Is the key of the filter, i.e. state, label, priority
   * @param value Is the value of the filter, i.e. state_id, label_id, priority
   * @returns boolean
   */

  getUserSelectedFilter(key: "state" | "priority" | "label", value: string): boolean {
    if (key == "state") {
      return this.userSelectedStates.includes(value);
    } else if (key == "label") {
      return this.userSelectedLabels.includes(value);
    } else if (key == "priority") {
      return this.userSelectedPriorities.includes(value);
    } else {
      return false;
    }
  }

  checkIfFilterExistsForKey: (key: "state" | "priority" | "label") => boolean = (key) => {
    if (key == "state") {
      return this.userSelectedStates.length > 0;
    } else if (key == "label") {
      return this.userSelectedLabels.length > 0;
    } else if (key == "priority") {
      return this.userSelectedPriorities.length > 0;
    } else {
      return false;
    }
  };

  clearUserSelectedFilter(key: "state" | "priority" | "label" | "all") {
    if (key == "state") {
      this.userSelectedStates = [];
    } else if (key == "label") {
      this.userSelectedLabels = [];
    } else if (key == "priority") {
      this.userSelectedPriorities = [];
    } else if (key == "all") {
      this.userSelectedStates = [];
      this.userSelectedLabels = [];
      this.userSelectedPriorities = [];
    }
  }

  getIfFiltersIsEmpty: () => boolean = () =>
    this.userSelectedStates.length === 0 &&
    this.userSelectedLabels.length === 0 &&
    this.userSelectedPriorities.length === 0;

  getURLDefinition = (
    workspaceSlug: string,
    projectId: string,
    action?: {
      key: "state" | "priority" | "label" | "all";
      value?: string;
      removeAll?: boolean;
    }
  ) => {
    let url = `/${workspaceSlug}/${projectId}?board=${this.currentIssueBoardView}`;

    if (action) {
      if (action.key === "state")
        this.userSelectedStates = action.removeAll
          ? []
          : [...this.userSelectedStates].filter((state) => state !== action.value);
      if (action.key === "label")
        this.userSelectedLabels = action.removeAll
          ? []
          : [...this.userSelectedLabels].filter((label) => label !== action.value);
      if (action.key === "priority")
        this.userSelectedPriorities = action.removeAll
          ? []
          : [...this.userSelectedPriorities].filter((priority) => priority !== action.value);
      if (action.key === "all") {
        this.userSelectedStates = [];
        this.userSelectedLabels = [];
        this.userSelectedPriorities = [];
      }
    }

    if (this.checkIfFilterExistsForKey("state")) {
      url += `&states=${this.userSelectedStates.join(",")}`;
    }
    if (this.checkIfFilterExistsForKey("label")) {
      url += `&labels=${this.userSelectedLabels.join(",")}`;
    }
    if (this.checkIfFilterExistsForKey("priority")) {
      url += `&priorities=${this.userSelectedPriorities.join(",")}`;
    }

    return url;
  };

  // action
  setCurrentIssueBoardView = async (view: TIssueBoardKeys) => {
    this.currentIssueBoardView = view;
  };

  getIssuesAsync = async (workspace_slug: string, project_slug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const response = await this.issueService.getPublicIssues(workspace_slug, project_slug);

      if (response) {
        const _states: IIssueState[] = [...response?.states];
        const _labels: IIssueLabel[] = [...response?.labels];
        const _issues: IIssue[] = [...response?.issues];
        runInAction(() => {
          this.states = _states;
          this.labels = _labels;
          this.issues = _issues;
          this.loader = false;
        });
        return response;
      }
    } catch (error) {
      this.loader = false;
      this.error = error;
      return error;
    }
  };
}

export default IssueStore;

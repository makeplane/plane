import { observable, computed, makeObservable, action, autorun, runInAction } from "mobx";
// helpers
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";
// types
import { RootStore } from "../root";
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueParams } from "types";

export interface IProfileIssueFilterStore {
  userDisplayProperties: IIssueDisplayProperties;
  userDisplayFilters: IIssueDisplayFilterOptions;
  userFilters: IIssueFilterOptions;
  // computed
  appliedFilters: TIssueParams[] | null;
  // action
  handleIssueFilters: (type: "userFilters" | "userDisplayFilters" | "userDisplayProperties", params: any) => void;
}

export class ProfileIssueFilterStore implements IProfileIssueFilterStore {
  // observables
  userFilters: IIssueFilterOptions = {
    priority: null,
    state_group: null,
    labels: null,
    start_date: null,
    target_date: null,
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

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      userFilters: observable.ref,
      userDisplayFilters: observable.ref,
      userDisplayProperties: observable.ref,
      // computed
      appliedFilters: computed,
      // actions
      handleIssueFilters: action,
    });

    this.rootStore = _rootStore;

    autorun(() => {
      if (this.userFilters || this.userDisplayFilters || this.userDisplayProperties) {
        const workspaceSlug = this.rootStore.workspace.workspaceSlug;
        const userId = this.rootStore.profileIssues?.userId;
        if (workspaceSlug && userId && this.rootStore.profileIssues.currentProfileTab && this.appliedFilters) {
          this.rootStore.profileIssues.fetchIssues(
            workspaceSlug,
            userId,
            this.rootStore.profileIssues.currentProfileTab
          );
        }
      }
    });
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
      labels: this.userFilters?.labels || undefined,
      start_date: this.userFilters?.start_date || undefined,
      target_date: this.userFilters?.target_date || undefined,
      group_by: this.userDisplayFilters?.group_by || undefined,
      order_by: this.userDisplayFilters?.order_by || "-created_at",
      show_empty_groups: this.userDisplayFilters?.show_empty_groups || true,
      type: this.userDisplayFilters?.type || undefined,
      assignees: undefined,
      created_by: undefined,
      subscriber: undefined,
    };

    const filteredParams = handleIssueQueryParamsByLayout(this.userDisplayFilters.layout, "profile_issues");
    if (filteredParams) filteredRouteParams = this.computedFilter(filteredRouteParams, filteredParams);

    return filteredRouteParams;
  }

  handleIssueFilters = (type: "userFilters" | "userDisplayFilters" | "userDisplayProperties", params: any) => {
    if (type === "userFilters") {
      const updatedFilters = { ...this.userFilters, ...params };
      runInAction(() => {
        this.userFilters = updatedFilters;
      });
    }
    if (type === "userDisplayFilters") {
      const updatedFilters = { ...this.userDisplayFilters, ...params };
      runInAction(() => {
        this.userDisplayFilters = updatedFilters;
      });
    }
    if (type === "userDisplayProperties") {
      const updatedFilters = { ...this.userDisplayProperties, ...params };
      runInAction(() => {
        this.userDisplayProperties = updatedFilters;
      });
    }
  };
}

import { observable, computed, makeObservable } from "mobx";
// helpers
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";
// types
import { RootStore } from "../root";
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueParams } from "types";

export interface IDraftIssueFilterStore {
  userDisplayProperties: IIssueDisplayProperties;
  userDisplayFilters: IIssueDisplayFilterOptions;
  userFilters: IIssueFilterOptions;

  // computed
  appliedFilters: TIssueParams[] | null;
}

export class DraftIssueFilterStore implements IDraftIssueFilterStore {
  // observables
  userFilters: IIssueFilterOptions = {
    priority: null,
    state_group: null,
    labels: null,
    start_date: null,
    target_date: null,
    assignees: null,
    created_by: null,
    subscriber: null,
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
    });

    this.rootStore = _rootStore;
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
      state: this.userFilters?.state || undefined,
      assignees: this.userFilters?.assignees || undefined,
      created_by: this.userFilters?.created_by || undefined,
      labels: this.userFilters?.labels || undefined,
      start_date: this.userFilters?.start_date || undefined,
      target_date: this.userFilters?.target_date || undefined,
      group_by: this.userDisplayFilters?.group_by || "state",
      order_by: this.userDisplayFilters?.order_by || "-created_at",
      sub_group_by: this.userDisplayFilters?.sub_group_by || undefined,
      type: this.userDisplayFilters?.type || undefined,
      sub_issue: this.userDisplayFilters?.sub_issue || true,
      show_empty_groups: this.userDisplayFilters?.show_empty_groups || true,
      start_target_date: this.userDisplayFilters?.start_target_date || true,
    };

    const filteredParams = handleIssueQueryParamsByLayout(this.userDisplayFilters.layout, "issues");
    if (filteredParams) filteredRouteParams = this.computedFilter(filteredRouteParams, filteredParams);

    if (this.userDisplayFilters.layout === "calendar") filteredRouteParams.group_by = "target_date";
    if (this.userDisplayFilters.layout === "gantt_chart") filteredRouteParams.start_target_date = true;

    return filteredRouteParams;
  }
}

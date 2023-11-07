import { observable, action, computed, makeObservable, runInAction } from "mobx";
// services
import { CycleService } from "services/cycle.service";
// helpers
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";
// types
import { RootStore } from "../root";
import { IIssueFilterOptions, TIssueParams } from "types";

export interface ICycleIssueFilterStore {
  loader: boolean;
  error: any | null;
  cycleFilters: IIssueFilterOptions;

  // action
  fetchCycleFilters: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<void>;
  updateCycleFilters: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    filterToUpdate: Partial<IIssueFilterOptions>
  ) => Promise<void>;

  // computed
  appliedFilters: TIssueParams[] | null;
}

export class CycleIssueFilterStore implements ICycleIssueFilterStore {
  // observables
  loader: boolean = false;
  error: any | null = null;
  cycleFilters: IIssueFilterOptions = {};
  // root store
  rootStore;
  // services
  cycleService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      error: observable.ref,
      cycleFilters: observable.ref,
      // computed
      appliedFilters: computed,
      // actions
      fetchCycleFilters: action,
      updateCycleFilters: action,
    });

    this.rootStore = _rootStore;
    this.cycleService = new CycleService();
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
    const userDisplayFilters = this.rootStore?.issueFilter?.userDisplayFilters;

    if (!this.cycleFilters || !userDisplayFilters) return null;

    let filteredRouteParams: any = {
      priority: this.cycleFilters?.priority || undefined,
      state_group: this.cycleFilters?.state_group || undefined,
      state: this.cycleFilters?.state || undefined,
      assignees: this.cycleFilters?.assignees || undefined,
      created_by: this.cycleFilters?.created_by || undefined,
      labels: this.cycleFilters?.labels || undefined,
      start_date: this.cycleFilters?.start_date || undefined,
      target_date: this.cycleFilters?.target_date || undefined,
      group_by: userDisplayFilters?.group_by || "state",
      order_by: userDisplayFilters?.order_by || "-created_at",
      sub_group_by: userDisplayFilters?.sub_group_by || undefined,
      type: userDisplayFilters?.type || undefined,
      sub_issue: userDisplayFilters?.sub_issue || true,
      show_empty_groups: userDisplayFilters?.show_empty_groups || true,
      start_target_date: userDisplayFilters?.start_target_date || true,
    };

    const filteredParams = handleIssueQueryParamsByLayout(userDisplayFilters.layout, "issues");

    if (filteredParams) filteredRouteParams = this.computedFilter(filteredRouteParams, filteredParams);

    if (userDisplayFilters.layout === "calendar") filteredRouteParams.group_by = "target_date";
    if (userDisplayFilters.layout === "gantt_chart") filteredRouteParams.start_target_date = true;

    return filteredRouteParams;
  }

  fetchCycleFilters = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    try {
      const cycleResponse = await this.cycleService.getCycleDetails(workspaceSlug, projectId, cycleId);
      runInAction(() => {
        this.cycleFilters = cycleResponse?.view_props?.filters || {};
      });
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      console.log("Failed to fetch user filters in issue filter store", error);
    }
  };

  updateCycleFilters = async (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    properties: Partial<IIssueFilterOptions>
  ) => {
    const newProperties = {
      ...this.cycleFilters,
      ...properties,
    };

    try {
      runInAction(() => {
        this.cycleFilters = newProperties;
      });

      const payload = {
        view_props: {
          filters: newProperties,
        },
      };

      await this.cycleService.updateCycle(workspaceSlug, projectId, cycleId, payload, undefined);
    } catch (error) {
      this.fetchCycleFilters(workspaceSlug, projectId, cycleId);

      runInAction(() => {
        this.error = error;
      });

      console.log("Failed to update user filters in issue filter store", error);
    }
  };
}

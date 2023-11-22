import { observable, action, computed, makeObservable, runInAction } from "mobx";
// services
import { CycleService } from "services/cycle.service";
// helpers
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";
// types
import { RootStore } from "../root";
import { IIssueFilterOptions, TIssueParams } from "types";

export interface ICycleIssueFiltersStore {
  loader: boolean;
  error: any | null;

  // observables
  userCycleFilters: {
    [cycleId: string]: {
      filters?: IIssueFilterOptions;
    };
  };

  // action
  fetchCycleFilters: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<void>;
  updateCycleFilters: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    filterToUpdate: Partial<IIssueFilterOptions>
  ) => Promise<void>;

  // computed
  appliedFilters: TIssueParams[] | undefined;
  cycleFilters:
    | {
        filters: IIssueFilterOptions;
      }
    | undefined;
}

export class CycleIssueFiltersStore implements ICycleIssueFiltersStore {
  // observables
  loader: boolean = false;
  error: any | null = null;
  userCycleFilters: {
    [cycleId: string]: {
      filters?: IIssueFilterOptions;
    };
  } = {};
  // root store
  rootStore;
  // services
  cycleService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      loader: observable.ref,
      error: observable.ref,
      // observables
      userCycleFilters: observable.ref,
      // actions
      fetchCycleFilters: action,
      updateCycleFilters: action,
      // computed
      appliedFilters: computed,
      cycleFilters: computed,
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

  get appliedFilters(): TIssueParams[] | undefined {
    const userDisplayFilters = this.rootStore?.projectIssuesFilter.issueFilters?.displayFilters;

    const cycleId = this.rootStore.cycle.cycleId;

    if (!cycleId) return undefined;

    const cycleFilters = this.userCycleFilters[cycleId]?.filters;

    if (!cycleFilters || !userDisplayFilters) return undefined;

    let filteredRouteParams: any = {
      priority: cycleFilters?.priority || undefined,
      state_group: cycleFilters?.state_group || undefined,
      state: cycleFilters?.state || undefined,
      assignees: cycleFilters?.assignees || undefined,
      created_by: cycleFilters?.created_by || undefined,
      labels: cycleFilters?.labels || undefined,
      start_date: cycleFilters?.start_date || undefined,
      target_date: cycleFilters?.target_date || undefined,
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

  get cycleFilters():
    | {
        filters: IIssueFilterOptions;
      }
    | undefined {
    const cycleId = this.rootStore.cycle.cycleId;

    if (!cycleId) return undefined;

    const activeCycleFilters = this.userCycleFilters[cycleId];

    if (!activeCycleFilters) return undefined;

    return {
      filters: activeCycleFilters?.filters ?? {},
    };
  }

  fetchCycleFilters = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    try {
      const cycleResponse = await this.cycleService.getCycleDetails(workspaceSlug, projectId, cycleId);

      runInAction(() => {
        this.userCycleFilters = {
          ...this.userCycleFilters,
          [cycleId]: {
            filters: cycleResponse?.view_props?.filters ?? {},
          },
        };
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
    const newViewProps = {
      filters: {
        ...this.userCycleFilters[cycleId]?.filters,
        ...properties,
      },
    };

    let updatedCycleFilters = this.userCycleFilters;
    if (!updatedCycleFilters) updatedCycleFilters = {};
    if (!updatedCycleFilters[cycleId]) updatedCycleFilters[cycleId] = {};

    updatedCycleFilters[cycleId] = newViewProps;

    try {
      runInAction(() => {
        this.userCycleFilters = { ...updatedCycleFilters };
      });

      const payload = {
        view_props: {
          filters: newViewProps.filters,
        },
      };

      const user = this.rootStore.user.currentUser ?? undefined;

      await this.cycleService.patchCycle(workspaceSlug, projectId, cycleId, payload);
    } catch (error) {
      this.fetchCycleFilters(workspaceSlug, projectId, cycleId);

      runInAction(() => {
        this.error = error;
      });

      console.log("Failed to update user filters in issue filter store", error);
    }
  };
}

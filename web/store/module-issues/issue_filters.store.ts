import { observable, action, computed, makeObservable, runInAction } from "mobx";
// services
import { ModuleService } from "services/module.service";
// helpers
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";
// types
import { RootStore } from "../root";
import { IIssueFilterOptions, TIssueParams } from "types";

export interface IModuleIssueFiltersStore {
  loader: boolean;
  error: any | null;

  // observables
  userModuleFilters: {
    [moduleId: string]: {
      filters?: IIssueFilterOptions;
    };
  };

  // action
  fetchModuleFilters: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<void>;
  updateModuleFilters: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    filterToUpdate: Partial<IIssueFilterOptions>
  ) => Promise<void>;

  // computed
  appliedFilters: TIssueParams[] | undefined;
  moduleFilters:
    | {
        filters: IIssueFilterOptions;
      }
    | undefined;
}

export class ModuleIssueFiltersStore implements IModuleIssueFiltersStore {
  // observables
  loader: boolean = false;
  error: any | null = null;
  userModuleFilters: {
    [moduleId: string]: {
      filters?: IIssueFilterOptions;
    };
  } = {};
  // root store
  rootStore;
  // services
  moduleService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      loader: observable.ref,
      error: observable.ref,
      // observables
      userModuleFilters: observable.ref,
      // actions
      fetchModuleFilters: action,
      updateModuleFilters: action,
      // computed
      appliedFilters: computed,
      moduleFilters: computed,
    });

    this.rootStore = _rootStore;
    this.moduleService = new ModuleService();
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

    const moduleId = this.rootStore.module.moduleId;

    if (!moduleId) return undefined;

    const moduleFilters = this.userModuleFilters[moduleId]?.filters;

    if (!moduleFilters || !userDisplayFilters) return undefined;

    let filteredRouteParams: any = {
      priority: moduleFilters?.priority || undefined,
      state_group: moduleFilters?.state_group || undefined,
      state: moduleFilters?.state || undefined,
      assignees: moduleFilters?.assignees || undefined,
      created_by: moduleFilters?.created_by || undefined,
      labels: moduleFilters?.labels || undefined,
      start_date: moduleFilters?.start_date || undefined,
      target_date: moduleFilters?.target_date || undefined,
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

  get moduleFilters():
    | {
        filters: IIssueFilterOptions;
      }
    | undefined {
    const moduleId = this.rootStore.module.moduleId;

    if (!moduleId) return undefined;

    const activeModuleFilters = this.userModuleFilters[moduleId];

    if (!activeModuleFilters) return undefined;

    return {
      filters: activeModuleFilters?.filters ?? {},
    };
  }

  fetchModuleFilters = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    try {
      const moduleResponse = await this.moduleService.getModuleDetails(workspaceSlug, projectId, moduleId);

      runInAction(() => {
        this.userModuleFilters = {
          ...this.userModuleFilters,
          [moduleId]: {
            filters: moduleResponse?.view_props?.filters ?? {},
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

  updateModuleFilters = async (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    properties: Partial<IIssueFilterOptions>
  ) => {
    const newViewProps = {
      filters: {
        ...this.userModuleFilters[moduleId]?.filters,
        ...properties,
      },
    };

    let updatedModuleFilters = this.userModuleFilters;
    if (!updatedModuleFilters) updatedModuleFilters = {};
    if (!updatedModuleFilters[moduleId]) updatedModuleFilters[moduleId] = {};

    updatedModuleFilters[moduleId] = newViewProps;

    try {
      runInAction(() => {
        this.userModuleFilters = { ...updatedModuleFilters };
      });

      const payload = {
        view_props: {
          filters: newViewProps.filters,
        },
      };

      const user = this.rootStore.user.currentUser ?? undefined;

      await this.moduleService.patchModule(workspaceSlug, projectId, moduleId, payload);
    } catch (error) {
      this.fetchModuleFilters(workspaceSlug, projectId, moduleId);

      runInAction(() => {
        this.error = error;
      });

      console.log("Failed to update user filters in issue filter store", error);
    }
  };
}

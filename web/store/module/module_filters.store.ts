import { observable, action, computed, makeObservable, runInAction } from "mobx";
// services
import { ProjectService } from "services/project";
import { ModuleService } from "services/module.service";
// helpers
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";
// types
import { RootStore } from "../root";
import { IIssueFilterOptions, IModule, TIssueParams } from "types";

export interface IModuleFilterStore {
  loader: boolean;
  error: any | null;
  moduleFilters: IIssueFilterOptions;
  defaultFilters: IIssueFilterOptions;

  // action
  fetchModuleFilters: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<IModule>;
  updateModuleFilters: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    filterToUpdate: Partial<IIssueFilterOptions>
  ) => Promise<void>;

  // computed
  appliedFilters: TIssueParams[] | null;
}

export class ModuleFilterStore implements IModuleFilterStore {
  loader: boolean = false;
  error: any | null = null;

  // observables
  moduleFilters: IIssueFilterOptions = {};
  defaultFilters: IIssueFilterOptions = {};

  // root store
  rootStore;

  // services
  projectService;
  moduleService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      loader: observable.ref,
      error: observable.ref,

      // observables
      defaultFilters: observable.ref,
      moduleFilters: observable.ref,

      // actions
      fetchModuleFilters: action,
      updateModuleFilters: action,

      // computed
      appliedFilters: computed,
    });

    this.rootStore = _rootStore;

    this.projectService = new ProjectService();
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

  get appliedFilters(): TIssueParams[] | null {
    const userDisplayFilters = this.rootStore.issueFilter.userDisplayFilters;

    if (!this.moduleFilters || !userDisplayFilters) return null;

    let filteredRouteParams: any = {
      priority: this.moduleFilters?.priority || undefined,
      state_group: this.moduleFilters?.state_group || undefined,
      state: this.moduleFilters?.state || undefined,
      assignees: this.moduleFilters?.assignees || undefined,
      created_by: this.moduleFilters?.created_by || undefined,
      labels: this.moduleFilters?.labels || undefined,
      start_date: this.moduleFilters?.start_date || undefined,
      target_date: this.moduleFilters?.target_date || undefined,
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

  fetchModuleFilters = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const response = await this.moduleService.getModuleDetails(workspaceSlug, projectId, moduleId);

      runInAction(() => {
        this.moduleFilters = response.view_props?.filters ?? {};
        this.loader = false;
        this.error = null;
      });

      return response;
    } catch (error) {
      console.error("Failed to fetch module details in module store", error);

      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };

  updateModuleFilters = async (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    filterToUpdate: Partial<IIssueFilterOptions>
  ) => {
    const newFilters = {
      ...this.moduleFilters,
      ...filterToUpdate,
    };

    try {
      runInAction(() => {
        this.moduleFilters = newFilters;
      });

      this.moduleService.patchModule(
        workspaceSlug,
        projectId,
        moduleId,
        {
          view_props: {
            filters: newFilters,
          },
        },
        this.rootStore.user.currentUser
      );
    } catch (error) {
      this.fetchModuleFilters(workspaceSlug, projectId, moduleId);

      runInAction(() => {
        this.error = error;
      });

      console.log("Failed to update user filters in issue filter store", error);
    }
  };
}

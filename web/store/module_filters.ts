import { observable, action, computed, makeObservable, runInAction } from "mobx";
// services
import { ProjectService } from "services/project.service";
import { ModuleService } from "services/modules.service";
// helpers
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";
// types
import { RootStore } from "./root";
import { IIssueFilterOptions, TIssueParams } from "types";

export interface IModuleFilterStore {
  loader: boolean;
  error: any | null;
  userModuleFilters: IIssueFilterOptions;
  defaultFilters: IIssueFilterOptions;

  // action
  updateUserModuleFilters: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    filterToUpdate: Partial<IIssueFilterOptions>
  ) => Promise<void>;

  // computed
  appliedFilters: TIssueParams[] | null;
}

class ModuleFilterStore implements IModuleFilterStore {
  loader: boolean = false;
  error: any | null = null;

  // observables
  userModuleFilters: IIssueFilterOptions = {};
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
      userModuleFilters: observable.ref,

      // actions
      updateUserModuleFilters: action,

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

    if (!this.userModuleFilters || !userDisplayFilters) return null;

    let filteredRouteParams: any = {
      priority: this.userModuleFilters?.priority || undefined,
      state_group: this.userModuleFilters?.state_group || undefined,
      state: this.userModuleFilters?.state || undefined,
      assignees: this.userModuleFilters?.assignees || undefined,
      created_by: this.userModuleFilters?.created_by || undefined,
      labels: this.userModuleFilters?.labels || undefined,
      start_date: this.userModuleFilters?.start_date || undefined,
      target_date: this.userModuleFilters?.target_date || undefined,
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

  updateUserModuleFilters = async (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    filterToUpdate: Partial<IIssueFilterOptions>
  ) => {
    const newFilters = {
      ...this.userModuleFilters,
      ...filterToUpdate,
    };

    try {
      runInAction(() => {
        this.userModuleFilters = newFilters;
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
        undefined
      );
    } catch (error) {
      this.rootStore.module.fetchModuleDetails(workspaceSlug, projectId, moduleId);

      runInAction(() => {
        this.error = error;
      });

      console.log("Failed to update user filters in issue filter store", error);
    }
  };
}

export default ModuleFilterStore;

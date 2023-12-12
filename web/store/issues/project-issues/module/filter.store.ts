import { observable, action, computed, makeObservable, runInAction } from "mobx";
// base class
import { IssueFilterBaseStore } from "store/issues";
// services
import { ProjectService, ProjectMemberService } from "services/project";
import { IssueService } from "services/issue";
import { ModuleService } from "services/module.service";
// helpers
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";
// types
import { RootStore } from "store/root";
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueParams } from "types";
import { EFilterType } from "store/issues/types";
import { isNil } from "../utils";

interface IModuleIssuesFilterOptions {
  filters: IIssueFilterOptions;
}

interface IProjectIssuesFilters {
  filters: IIssueFilterOptions | undefined;
  displayFilters: IIssueDisplayFilterOptions | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
}

export interface IModuleIssuesFilterStore {
  // observable
  loader: boolean;
  filters: { [moduleId: string]: IModuleIssuesFilterOptions } | undefined;
  // computed
  issueFilters: IProjectIssuesFilters | undefined;
  appliedFilters: TIssueParams[] | undefined;
  // actions
  fetchModuleFilters: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<IIssueFilterOptions>;
  updateModuleFilters: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    type: EFilterType,
    filters: IIssueFilterOptions
  ) => Promise<IModuleIssuesFilterOptions | undefined>;

  fetchFilters: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<void>;
  updateFilters: (
    workspaceSlug: string,
    projectId: string,
    filterType: EFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties,
    moduleId?: string | undefined
  ) => Promise<void>;
}

export class ModuleIssuesFilterStore extends IssueFilterBaseStore implements IModuleIssuesFilterStore {
  // observables
  loader: boolean = false;
  filters: { [projectId: string]: IModuleIssuesFilterOptions } | undefined = undefined;
  // root store
  rootStore;
  // services
  projectService;
  projectMemberService;
  issueService;
  moduleService;

  constructor(_rootStore: RootStore) {
    super(_rootStore);

    makeObservable(this, {
      // observables
      loader: observable.ref,
      filters: observable.ref,
      // computed
      issueFilters: computed,
      appliedFilters: computed,
      // actions
      fetchModuleFilters: action,
      updateModuleFilters: action,
      fetchFilters: action,
      updateFilters: action,
    });

    this.rootStore = _rootStore;

    this.projectService = new ProjectService();
    this.projectMemberService = new ProjectMemberService();
    this.issueService = new IssueService();
    this.moduleService = new ModuleService();
  }

  get issueFilters() {
    const projectId = this.rootStore.project.projectId;
    const moduleId = this.rootStore.module.moduleId;
    if (!projectId || !moduleId) return undefined;

    const displayFilters = this.rootStore.issuesFilter.issueDisplayFilters(projectId);
    const moduleFilters = this.filters?.[moduleId];

    const _filters: IProjectIssuesFilters = {
      filters: moduleFilters?.filters,
      displayFilters: displayFilters?.displayFilters,
      displayProperties: displayFilters?.displayProperties,
    };

    return _filters;
  }

  get appliedFilters() {
    const userFilters = this.issueFilters;
    if (!userFilters) return undefined;

    let filteredRouteParams: any = {
      priority: userFilters?.filters?.priority || undefined,
      state_group: userFilters?.filters?.state_group || undefined,
      state: userFilters?.filters?.state || undefined,
      assignees: userFilters?.filters?.assignees || undefined,
      mentions: userFilters?.filters?.mentions || undefined,
      created_by: userFilters?.filters?.created_by || undefined,
      labels: userFilters?.filters?.labels || undefined,
      start_date: userFilters?.filters?.start_date || undefined,
      target_date: userFilters?.filters?.target_date || undefined,
      type: userFilters?.displayFilters?.type || undefined,
      sub_issue: isNil(userFilters?.displayFilters?.sub_issue) ? true : userFilters?.displayFilters?.sub_issue,
      show_empty_groups: isNil(userFilters?.displayFilters?.show_empty_groups)
        ? true
        : userFilters?.displayFilters?.show_empty_groups,
      start_target_date: isNil(userFilters?.displayFilters?.start_target_date)
        ? true
        : userFilters?.displayFilters?.start_target_date,
    };

    const filteredParams = handleIssueQueryParamsByLayout(userFilters?.displayFilters?.layout, "issues");
    if (filteredParams) filteredRouteParams = this.computedFilter(filteredRouteParams, filteredParams);

    if (userFilters?.displayFilters?.layout === "calendar") filteredRouteParams.group_by = "target_date";
    if (userFilters?.displayFilters?.layout === "gantt_chart") filteredRouteParams.start_target_date = true;

    return filteredRouteParams;
  }

  fetchModuleFilters = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    try {
      const moduleFilters = await this.moduleService.getModuleDetails(workspaceSlug, projectId, moduleId);

      const filters: IIssueFilterOptions = {
        assignees: moduleFilters?.view_props?.filters?.assignees || null,
        mentions: moduleFilters?.view_props?.filters?.mentions || null,
        created_by: moduleFilters?.view_props?.filters?.created_by || null,
        labels: moduleFilters?.view_props?.filters?.labels || null,
        priority: moduleFilters?.view_props?.filters?.priority || null,
        project: moduleFilters?.view_props?.filters?.project || null,
        start_date: moduleFilters?.view_props?.filters?.start_date || null,
        state: moduleFilters?.view_props?.filters?.state || null,
        state_group: moduleFilters?.view_props?.filters?.state_group || null,
        subscriber: moduleFilters?.view_props?.filters?.subscriber || null,
        target_date: moduleFilters?.view_props?.filters?.target_date || null,
      };

      const issueFilters: IModuleIssuesFilterOptions = {
        filters: filters,
      };

      let _filters = { ...this.filters };
      if (!_filters) _filters = {};
      if (!_filters[moduleId]) _filters[moduleId] = { filters: {} };
      _filters[moduleId] = issueFilters;

      runInAction(() => {
        this.filters = _filters;
      });

      return filters;
    } catch (error) {
      this.fetchFilters(workspaceSlug, projectId, moduleId);
      throw error;
    }
  };

  updateModuleFilters = async (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    type: EFilterType,
    filters: IIssueFilterOptions
  ) => {
    if (!moduleId) return;
    try {
      let _moduleIssueFilters = { ...this.filters };
      if (!_moduleIssueFilters) _moduleIssueFilters = {};
      if (!_moduleIssueFilters[moduleId]) _moduleIssueFilters[moduleId] = { filters: {} };

      const _filters = { filters: { ..._moduleIssueFilters[moduleId].filters } };

      if (type === EFilterType.FILTERS) _filters.filters = { ..._filters.filters, ...filters };

      _moduleIssueFilters[moduleId] = { filters: _filters.filters };

      runInAction(() => {
        this.filters = _moduleIssueFilters;
      });

      await this.moduleService.patchModule(workspaceSlug, projectId, moduleId, {
        view_props: { filters: _filters.filters },
      });

      return _filters;
    } catch (error) {
      this.fetchFilters(workspaceSlug, projectId, moduleId);
      throw error;
    }
  };

  fetchFilters = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    try {
      await this.rootStore.issuesFilter.fetchDisplayFilters(workspaceSlug, projectId);
      await this.rootStore.issuesFilter.fetchDisplayProperties(workspaceSlug, projectId);
      await this.fetchModuleFilters(workspaceSlug, projectId, moduleId);
      return;
    } catch (error) {
      this.fetchFilters(workspaceSlug, projectId, moduleId);
      throw error;
    }
  };

  updateFilters = async (
    workspaceSlug: string,
    projectId: string,
    filterType: EFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties,
    moduleId?: string | undefined
  ) => {
    try {
      if (!moduleId) throw new Error();

      switch (filterType) {
        case EFilterType.FILTERS:
          await this.updateModuleFilters(
            workspaceSlug,
            projectId,
            moduleId,
            filterType,
            filters as IIssueFilterOptions
          );
          break;
        case EFilterType.DISPLAY_FILTERS:
          await this.rootStore.issuesFilter.updateDisplayFilters(
            workspaceSlug,
            projectId,
            filterType,
            filters as IIssueDisplayFilterOptions
          );
          break;
        case EFilterType.DISPLAY_PROPERTIES:
          await this.rootStore.issuesFilter.updateDisplayProperties(
            workspaceSlug,
            projectId,
            filters as IIssueDisplayProperties
          );
          break;
      }

      return;
    } catch (error) {
      throw error;
    }
  };
}

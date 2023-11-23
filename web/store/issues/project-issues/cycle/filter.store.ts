import { observable, action, computed, makeObservable, runInAction } from "mobx";
// base class
import { IssueFilterBaseStore } from "store/issues";
// services
import { ProjectService, ProjectMemberService } from "services/project";
import { IssueService } from "services/issue";
import { CycleService } from "services/cycle.service";
// helpers
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";
// types
import { RootStore } from "store/root";
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueParams } from "types";
import { EFilterType } from "store/issues/types";

interface ICycleIssuesFilterOptions {
  filters: IIssueFilterOptions;
}

interface IProjectIssuesFilters {
  filters: IIssueFilterOptions | undefined;
  displayFilters: IIssueDisplayFilterOptions | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
}

export interface ICycleIssuesFilterStore {
  // observable
  loader: boolean;
  filters: { [cycleId: string]: ICycleIssuesFilterOptions } | undefined;
  // computed
  issueFilters: IProjectIssuesFilters | undefined;
  appliedFilters: TIssueParams[] | undefined;
  // actions
  fetchCycleFilters: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<IIssueFilterOptions>;
  updateCycleFilters: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    type: EFilterType,
    filters: IIssueFilterOptions
  ) => Promise<ICycleIssuesFilterOptions>;

  fetchFilters: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<void>;
  updateFilters: (
    workspaceSlug: string,
    projectId: string,
    filterType: EFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties,
    cycleId?: string | undefined
  ) => Promise<void>;
}

export class CycleIssuesFilterStore extends IssueFilterBaseStore implements ICycleIssuesFilterStore {
  // observables
  loader: boolean = false;
  filters: { [projectId: string]: ICycleIssuesFilterOptions } | undefined = undefined;
  // root store
  rootStore;
  // services
  projectService;
  projectMemberService;
  issueService;
  cycleService;

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
      fetchCycleFilters: action,
      updateCycleFilters: action,
      fetchFilters: action,
      updateFilters: action,
    });

    this.rootStore = _rootStore;

    this.projectService = new ProjectService();
    this.projectMemberService = new ProjectMemberService();
    this.issueService = new IssueService();
    this.cycleService = new CycleService();
  }

  get issueFilters() {
    const projectId = this.rootStore.project.projectId;
    const cycleId = this.rootStore.cycle.cycleId;
    if (!projectId || !cycleId) return undefined;

    const displayFilters = this.rootStore.issuesFilter.issueDisplayFilters(projectId);
    const cycleFilters = this.filters?.[cycleId];

    const _filters: IProjectIssuesFilters = {
      filters: cycleFilters?.filters,
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
      sub_issue: userFilters?.displayFilters?.sub_issue || true,
      show_empty_groups: userFilters?.displayFilters?.show_empty_groups || true,
      start_target_date: userFilters?.displayFilters?.start_target_date || true,
    };

    const filteredParams = handleIssueQueryParamsByLayout(userFilters?.displayFilters?.layout, "issues");
    if (filteredParams) filteredRouteParams = this.computedFilter(filteredRouteParams, filteredParams);

    if (userFilters?.displayFilters?.layout === "calendar") filteredRouteParams.group_by = "target_date";
    if (userFilters?.displayFilters?.layout === "gantt_chart") filteredRouteParams.start_target_date = true;

    return filteredRouteParams;
  }

  fetchCycleFilters = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    try {
      const cycleFilters = await this.cycleService.getCycleDetails(workspaceSlug, projectId, cycleId);

      const filters: IIssueFilterOptions = {
        assignees: cycleFilters?.view_props?.filters?.assignees || null,
        mentions: cycleFilters?.view_props?.filters?.mentions || null,
        created_by: cycleFilters?.view_props?.filters?.created_by || null,
        labels: cycleFilters?.view_props?.filters?.labels || null,
        priority: cycleFilters?.view_props?.filters?.priority || null,
        project: cycleFilters?.view_props?.filters?.project || null,
        start_date: cycleFilters?.view_props?.filters?.start_date || null,
        state: cycleFilters?.view_props?.filters?.state || null,
        state_group: cycleFilters?.view_props?.filters?.state_group || null,
        subscriber: cycleFilters?.view_props?.filters?.subscriber || null,
        target_date: cycleFilters?.view_props?.filters?.target_date || null,
      };

      const issueFilters: ICycleIssuesFilterOptions = {
        filters: filters,
      };

      let _filters = { ...this.filters };
      if (!_filters) _filters = {};
      if (!_filters[cycleId]) _filters[cycleId] = { filters: {} };
      _filters[cycleId] = issueFilters;

      runInAction(() => {
        this.filters = _filters;
      });

      return filters;
    } catch (error) {
      this.fetchFilters(workspaceSlug, projectId, cycleId);
      throw error;
    }
  };

  updateCycleFilters = async (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    type: EFilterType,
    filters: IIssueFilterOptions
  ) => {
    try {
      let _cycleIssueFilters = { ...this.filters };
      if (!_cycleIssueFilters) _cycleIssueFilters = {};
      if (!_cycleIssueFilters[cycleId]) _cycleIssueFilters[cycleId] = { filters: {} };

      const _filters = { filters: { ..._cycleIssueFilters[cycleId].filters } };

      if (type === EFilterType.FILTERS) _filters.filters = { ..._filters.filters, ...filters };

      _cycleIssueFilters[cycleId] = { filters: _filters.filters };

      runInAction(() => {
        this.filters = _cycleIssueFilters;
      });

      await this.cycleService.patchCycle(workspaceSlug, projectId, cycleId, {
        view_props: { filters: _filters.filters },
      });

      return _filters;
    } catch (error) {
      this.fetchFilters(workspaceSlug, projectId, cycleId);
      throw error;
    }
  };

  fetchFilters = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    try {
      await this.rootStore.issuesFilter.fetchDisplayFilters(workspaceSlug, projectId);
      await this.rootStore.issuesFilter.fetchDisplayProperties(workspaceSlug, projectId);
      await this.fetchCycleFilters(workspaceSlug, projectId, cycleId);
      return;
    } catch (error) {
      this.fetchFilters(workspaceSlug, projectId, cycleId);
      throw error;
    }
  };

  updateFilters = async (
    workspaceSlug: string,
    projectId: string,
    filterType: EFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties,
    cycleId?: string | undefined
  ) => {
    try {
      if (!cycleId) throw new Error();
      switch (filterType) {
        case EFilterType.FILTERS:
          await this.updateCycleFilters(workspaceSlug, projectId, cycleId, filterType, filters as IIssueFilterOptions);
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

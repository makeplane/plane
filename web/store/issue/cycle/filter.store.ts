import { observable, action, computed, makeObservable, runInAction } from "mobx";
import set from "lodash/set";
import isEmpty from "lodash/isEmpty";
// base class
import { IssueFilterHelperStore } from "../helpers/issue-filter-helper.store";
// services
import { ProjectService, ProjectMemberService } from "services/project";
import { IssueService } from "services/issue";
import { CycleService } from "services/cycle.service";
// helpers
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";
// types
import { IssueRootStore } from "../root.store";
import {
  IIssueFilterOptions,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilters,
  TIssueParams,
} from "types";
// constants
import { EIssueFilterType } from "constants/issue";
import { isNil } from "constants/common";

interface ICycleIssuesFilterOptions {
  filters: IIssueFilterOptions;
}

export interface ICycleIssuesFilter {
  // observable
  loader: boolean;
  filters: { [cycleId: string]: ICycleIssuesFilterOptions };
  // computed
  issueFilters: IIssueFilters | undefined;
  appliedFilters: TIssueParams[] | undefined;
  // actions
  fetchCycleFilters: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<void>;
  updateCycleFilters: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    type: EIssueFilterType,
    filters: IIssueFilterOptions
  ) => Promise<void>;

  fetchFilters: (workspaceSlug: string, projectId: string, cycleId?: string | undefined) => Promise<void>;
  updateFilters: (
    workspaceSlug: string,
    projectId: string,
    filterType: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties,
    cycleId?: string | undefined
  ) => Promise<void>;
}

export class CycleIssuesFilter extends IssueFilterHelperStore implements ICycleIssuesFilter {
  // observables
  loader: boolean = false;
  filters: { [projectId: string]: ICycleIssuesFilterOptions } = {};
  // root store
  rootStore;
  // services
  projectService;
  projectMemberService;
  issueService;
  cycleService;

  constructor(_rootStore: IssueRootStore) {
    super(_rootStore);

    makeObservable(this, {
      // observables
      loader: observable.ref,
      filters: observable,
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
    const projectId = this.rootStore.projectId;
    const cycleId = this.rootStore.cycleId;
    if (!projectId || !cycleId) return undefined;

    const displayFilters = this.rootStore.issuesFilter.issueDisplayFilters(projectId);
    const cycleFilters = this.filters?.[cycleId];
    if (isEmpty(displayFilters) || isEmpty(cycleFilters)) return undefined;

    const _filters: IIssueFilters = {
      filters: isEmpty(cycleFilters?.filters) ? undefined : cycleFilters?.filters,
      displayFilters: isEmpty(displayFilters?.displayFilters) ? undefined : displayFilters?.displayFilters,
      displayProperties: isEmpty(displayFilters?.displayProperties) ? undefined : displayFilters?.displayProperties,
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

      runInAction(() => {
        set(this.filters, [cycleId, "filters"], filters);
      });
    } catch (error) {
      throw error;
    }
  };

  updateCycleFilters = async (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    type: EIssueFilterType,
    filters: IIssueFilterOptions
  ) => {
    try {
      const _filters = {
        filters: this.filters[cycleId].filters as IIssueFilterOptions,
      };

      if (type === EIssueFilterType.FILTERS) {
        _filters.filters = { ..._filters.filters, ...filters };

        const updated_filters = filters as IIssueFilterOptions;
        runInAction(() => {
          Object.keys(updated_filters).forEach((_key) => {
            set(this.filters, [cycleId, "filters", _key], updated_filters[_key as keyof IIssueFilterOptions]);
          });
        });
      }

      await this.cycleService.patchCycle(workspaceSlug, projectId, cycleId, {
        view_props: { filters: _filters.filters },
      });
    } catch (error) {
      this.fetchFilters(workspaceSlug, projectId, cycleId);
      throw error;
    }
  };

  fetchFilters = async (workspaceSlug: string, projectId: string, cycleId: string | undefined = undefined) => {
    try {
      await this.rootStore.issuesFilter.fetchDisplayFilters(workspaceSlug, projectId);
      await this.rootStore.issuesFilter.fetchDisplayProperties(workspaceSlug, projectId);
      if (!cycleId) return;
      await this.fetchCycleFilters(workspaceSlug, projectId, cycleId);
    } catch (error) {
      this.fetchFilters(workspaceSlug, projectId, cycleId);
      throw error;
    }
  };

  updateFilters = async (
    workspaceSlug: string,
    projectId: string,
    filterType: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties,
    cycleId?: string | undefined
  ) => {
    if (!cycleId) return;

    try {
      switch (filterType) {
        case EIssueFilterType.FILTERS:
          await this.updateCycleFilters(workspaceSlug, projectId, cycleId, filterType, filters as IIssueFilterOptions);
          this.rootStore.cycleIssues.fetchIssues(workspaceSlug, projectId, "mutation", cycleId);
          break;
        case EIssueFilterType.DISPLAY_FILTERS:
          await this.rootStore.issuesFilter.updateDisplayFilters(
            workspaceSlug,
            projectId,
            filterType,
            filters as IIssueDisplayFilterOptions
          );
          break;
        case EIssueFilterType.DISPLAY_PROPERTIES:
          await this.rootStore.issuesFilter.updateDisplayProperties(
            workspaceSlug,
            projectId,
            filters as IIssueDisplayProperties
          );
          break;
        default:
          break;
      }

      return;
    } catch (error) {
      this.fetchFilters(workspaceSlug, projectId, cycleId);
      throw error;
    }
  };
}

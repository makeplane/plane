import { observable, action, computed, makeObservable, runInAction } from "mobx";
// base class
import { IssueFilterBaseStore } from "store/issues";
// services
import { ProjectService, ProjectMemberService } from "services/project";
import { IssueService } from "services/issue";
import { ViewService } from "services/view.service";
// helpers
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";
// types
import { RootStore } from "store/root";
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueParams } from "types";
import { EFilterType } from "store/issues/types";

interface IViewIssuesFilterOptions {
  filters: IIssueFilterOptions;
}

interface IProjectIssuesFilters {
  filters: IIssueFilterOptions | undefined;
  displayFilters: IIssueDisplayFilterOptions | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
}

export interface IViewIssuesFilterStore {
  // observable
  loader: boolean;
  filters: { [view_id: string]: IViewIssuesFilterOptions } | undefined;
  // computed
  issueFilters: IProjectIssuesFilters | undefined;
  appliedFilters: TIssueParams[] | undefined;
  // actions
  fetchViewFilters: (workspaceSlug: string, projectId: string, viewId: string) => Promise<IIssueFilterOptions>;
  updateViewFilters: (
    workspaceSlug: string,
    projectId: string,
    viewId: string,
    type: EFilterType,
    filters: IIssueFilterOptions
  ) => Promise<IViewIssuesFilterOptions | undefined>;

  fetchFilters: (workspaceSlug: string, projectId: string, viewId: string) => Promise<void>;
  updateFilters: (
    workspaceSlug: string,
    projectId: string,
    filterType: EFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties,
    viewId?: string | undefined
  ) => Promise<void>;
}

export class ViewIssuesFilterStore extends IssueFilterBaseStore implements IViewIssuesFilterStore {
  // observables
  loader: boolean = false;
  filters: { [projectId: string]: IViewIssuesFilterOptions } | undefined = undefined;
  // root store
  rootStore;
  // services
  projectService;
  projectMemberService;
  issueService;
  viewService;

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
      fetchViewFilters: action,
      updateViewFilters: action,
      fetchFilters: action,
      updateFilters: action,
    });

    this.rootStore = _rootStore;

    this.projectService = new ProjectService();
    this.projectMemberService = new ProjectMemberService();
    this.issueService = new IssueService();
    this.viewService = new ViewService();
  }

  get issueFilters() {
    const projectId = this.rootStore.project.projectId;
    const viewId = this.rootStore.projectViews.viewId;
    if (!projectId || !viewId) return undefined;

    const displayFilters = this.rootStore.issuesFilter.issueDisplayFilters(projectId);
    const viewFilters = this.filters?.[viewId];

    const _filters: IProjectIssuesFilters = {
      filters: viewFilters?.filters,
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

  fetchViewFilters = async (workspaceSlug: string, projectId: string, viewId: string) => {
    try {
      const viewFilters = await this.viewService.getViewDetails(workspaceSlug, projectId, viewId);

      const filters: IIssueFilterOptions = {
        assignees: viewFilters?.query_data?.assignees || null,
        mentions: viewFilters?.query_data?.mentions || null,
        created_by: viewFilters?.query_data?.created_by || null,
        labels: viewFilters?.query_data?.labels || null,
        priority: viewFilters?.query_data?.priority || null,
        project: viewFilters?.query_data?.project || null,
        start_date: viewFilters?.query_data?.start_date || null,
        state: viewFilters?.query_data?.state || null,
        state_group: viewFilters?.query_data?.state_group || null,
        subscriber: viewFilters?.query_data?.subscriber || null,
        target_date: viewFilters?.query_data?.target_date || null,
      };

      const issueFilters: IViewIssuesFilterOptions = {
        filters: filters,
      };

      let _filters = { ...this.filters };
      if (!_filters) _filters = {};
      if (!_filters[viewId]) _filters[viewId] = { filters: {} };
      _filters[viewId] = issueFilters;

      runInAction(() => {
        this.filters = _filters;
      });

      return filters;
    } catch (error) {
      this.fetchFilters(workspaceSlug, projectId, viewId);
      throw error;
    }
  };

  updateViewFilters = async (
    workspaceSlug: string,
    projectId: string,
    viewId: string,
    type: EFilterType,
    filters: IIssueFilterOptions
  ) => {
    if (!viewId) return;
    try {
      let _moduleIssueFilters = { ...this.filters };
      if (!_moduleIssueFilters) _moduleIssueFilters = {};
      if (!_moduleIssueFilters[viewId]) _moduleIssueFilters[viewId] = { filters: {} };

      const _filters = { filters: { ..._moduleIssueFilters[viewId].filters } };

      if (type === EFilterType.FILTERS) _filters.filters = { ..._filters.filters, ...filters };

      _moduleIssueFilters[viewId] = { filters: _filters.filters };

      runInAction(() => {
        this.filters = _moduleIssueFilters;
      });

      await this.viewService.patchView(workspaceSlug, projectId, viewId, {
        query_data: { ..._filters.filters },
      });

      return _filters;
    } catch (error) {
      this.fetchFilters(workspaceSlug, projectId, viewId);
      throw error;
    }
  };

  fetchFilters = async (workspaceSlug: string, projectId: string, viewId: string) => {
    try {
      await this.rootStore.issuesFilter.fetchDisplayFilters(workspaceSlug, projectId);
      await this.rootStore.issuesFilter.fetchDisplayProperties(workspaceSlug, projectId);
      await this.fetchViewFilters(workspaceSlug, projectId, viewId);
      return;
    } catch (error) {
      this.fetchFilters(workspaceSlug, projectId, viewId);
      throw error;
    }
  };

  updateFilters = async (
    workspaceSlug: string,
    projectId: string,
    filterType: EFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties,
    viewId?: string | undefined
  ) => {
    try {
      if (!viewId) throw new Error();

      switch (filterType) {
        case EFilterType.FILTERS:
          await this.updateViewFilters(workspaceSlug, projectId, viewId, filterType, filters as IIssueFilterOptions);
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

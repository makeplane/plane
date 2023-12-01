import { action, makeObservable, observable, runInAction } from "mobx";
// types
import { RootStore } from "store/root";
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueParams } from "types";
import { EFilterType } from "store/issues/types";
import { IssueFilterBaseStore } from "../project-issues/base-issue-filter.store";
// helpers
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";
// services
import { WorkspaceService } from "services/workspace.service";

interface IIssuesDisplayOptions {
  filters: IIssueFilterOptions;
}

type TIssueViewTypes = "all-issues" | "assigned" | "created" | "subscribed" | string;

interface IIssueViewOptions {
  "all-issues": IIssuesDisplayOptions;
  assigned: IIssuesDisplayOptions;
  created: IIssuesDisplayOptions;
  subscribed: IIssuesDisplayOptions;
  [view_id: string]: IIssuesDisplayOptions;
}

interface IWorkspaceProperties {
  filters: IIssueFilterOptions;
  displayFilters: IIssueDisplayFilterOptions;
  displayProperties: IIssueDisplayProperties;
}

export interface IGlobalIssuesFilterStore {
  // observables
  currentView: TIssueViewTypes;
  workspaceProperties: { [workspaceId: string]: IWorkspaceProperties } | undefined;
  workspaceViewFilters: { [workspaceId: string]: IIssueViewOptions } | undefined;
  // computed
  issueFilters: IWorkspaceProperties | undefined;
  appliedFilters: TIssueParams[] | undefined;
  // helpers
  issueDisplayFilters: (workspaceId: string) => IIssuesDisplayOptions | undefined;
  // actions
  setCurrentView: (view: TIssueViewTypes) => void;
  fetchWorkspaceProperties: (workspaceSlug: string) => Promise<IWorkspaceProperties>;
  updateWorkspaceProperties: (
    workspaceSlug: string,
    type: EFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties
  ) => Promise<IWorkspaceProperties>;

  fetchWorkspaceViewFilters: (workspaceId: string, view: TIssueViewTypes) => Promise<IIssueFilterOptions>;
  updateWorkspaceViewFilters: (workspaceId: string, filters: IIssueFilterOptions) => Promise<IIssueFilterOptions>;

  fetchFilters: (workspaceSlug: string, view: TIssueViewTypes) => Promise<void>;
  updateFilters: (
    workspaceSlug: string,
    filterType: EFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties
  ) => Promise<void>;
}

export class GlobalIssuesFilterStore extends IssueFilterBaseStore implements IGlobalIssuesFilterStore {
  // observables
  currentView: TIssueViewTypes = "all-issues";
  workspaceProperties: { [workspaceId: string]: IWorkspaceProperties } | undefined = undefined;
  workspaceViewFilters: { [workspaceId: string]: IIssueViewOptions } | undefined = undefined;
  // root store
  rootStore;
  // service
  workspaceService;

  constructor(_rootStore: RootStore) {
    super(_rootStore);

    makeObservable(this, {
      // observables
      currentView: observable.ref,
      workspaceProperties: observable.ref,
      workspaceViewFilters: observable.ref,
      // computed
      // actions
      setCurrentView: action,
      fetchWorkspaceProperties: action,
      updateWorkspaceProperties: action,
      fetchWorkspaceViewFilters: action,
      updateWorkspaceViewFilters: action,
    });
    // root store
    this.rootStore = _rootStore;
    // services
    this.workspaceService = new WorkspaceService();
  }

  // computed

  // helpers
  issueDisplayFilters = (workspaceId: string) => {
    if (!workspaceId || !this.currentView) return undefined;
    const filters: IWorkspaceProperties = {
      filters: this.workspaceProperties?.[workspaceId]?.filters || {},
      displayFilters: this.workspaceProperties?.[workspaceId]?.displayFilters || {},
      displayProperties: this.workspaceProperties?.[workspaceId]?.displayProperties || {},
    };

    if (!["all-issues", "assigned", "created", "subscribed"].includes(this.currentView)) {
      const viewFilters = this.workspaceViewFilters?.[workspaceId]?.[this.currentView];
      if (viewFilters) {
        filters.filters = { ...filters.filters, ...viewFilters?.filters };
      }
    }

    return filters;
  };

  // actions
  setCurrentView = (view: TIssueViewTypes) => {
    this.currentView = view;
  };

  fetchWorkspaceProperties = async (workspaceSlug: string) => {
    try {
      let _filters: IWorkspaceProperties = {} as IWorkspaceProperties;

      const filtersResponse = await this.workspaceService.workspaceMemberMe(workspaceSlug);
      _filters = {
        filters: { ...filtersResponse?.view_props?.filters } || null,
        displayFilters: { ...filtersResponse?.view_props?.display_filters } || null,
        displayProperties: { ...filtersResponse?.view_props?.display_properties } || null,
      };

      let filters: IIssueFilterOptions = {
        assignees: _filters?.filters?.assignees || null,
        mentions: _filters?.filters?.mentions || null,
        created_by: _filters?.filters?.created_by || null,
        labels: _filters?.filters?.labels || null,
        priority: _filters?.filters?.priority || null,
        project: _filters?.filters?.project || null,
        start_date: _filters?.filters?.start_date || null,
        state: _filters?.filters?.state || null,
        state_group: _filters?.filters?.state_group || null,
        subscriber: _filters?.filters?.subscriber || null,
        target_date: _filters?.filters?.target_date || null,
      };

      const currentUserId = this.rootStore.user.currentUser?.id;
      if (currentUserId && this.currentView === "assigned")
        filters = {
          ...filters,
          assignees: [currentUserId],
          created_by: null,
          subscriber: null,
        };

      if (currentUserId && this.currentView === "created")
        filters = {
          ...filters,
          assignees: null,
          created_by: [currentUserId],
          subscriber: null,
        };
      if (currentUserId && this.currentView === "subscribed")
        filters = {
          ...filters,
          assignees: null,
          created_by: null,
          subscriber: [currentUserId],
        };

      const displayFilters: IIssueDisplayFilterOptions = {
        calendar: {
          show_weekends: _filters?.displayFilters?.calendar?.show_weekends || false,
          layout: _filters?.displayFilters?.calendar?.layout || "month",
        },
        group_by: _filters?.displayFilters?.group_by || null,
        sub_group_by: _filters?.displayFilters?.sub_group_by || null,
        layout: _filters?.displayFilters?.layout || "list",
        order_by: _filters?.displayFilters?.order_by || "-created_at",
        show_empty_groups: _filters?.displayFilters?.show_empty_groups || false,
        start_target_date: _filters?.displayFilters?.start_target_date || false,
        sub_issue: _filters?.displayFilters?.sub_issue || false,
        type: _filters?.displayFilters?.type || null,
      };

      const displayProperties: IIssueDisplayProperties = {
        assignee: _filters?.displayProperties?.assignee || false,
        start_date: _filters?.displayProperties?.start_date || false,
        due_date: _filters?.displayProperties?.due_date || false,
        labels: _filters?.displayProperties?.labels || false,
        key: _filters?.displayProperties?.key || false,
        priority: _filters?.displayProperties?.priority || false,
        state: _filters?.displayProperties?.state || false,
        sub_issue_count: _filters?.displayProperties?.sub_issue_count || false,
        link: _filters?.displayProperties?.link || false,
        attachment_count: _filters?.displayProperties?.attachment_count || false,
        estimate: _filters?.displayProperties?.estimate || false,
        created_on: _filters?.displayProperties?.created_on || false,
        updated_on: _filters?.displayProperties?.updated_on || false,
      };

      const issueFilters: IWorkspaceProperties = {
        filters: filters,
        displayFilters: displayFilters,
        displayProperties: displayProperties,
      };

      let _workspaceProperties = { ...this.workspaceProperties };
      if (!_workspaceProperties) _workspaceProperties = {};
      if (!_workspaceProperties[workspaceSlug])
        _workspaceProperties[workspaceSlug] = {
          filters: {},
          displayFilters: {},
          displayProperties: {},
        };
      _workspaceProperties[workspaceSlug] = { ...issueFilters };

      runInAction(() => {
        this.workspaceProperties = _workspaceProperties;
      });

      return issueFilters;
    } catch (error) {
      throw error;
    }
  };

  updateWorkspaceProperties = async (
    workspaceSlug: string,
    type: EFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties
  ) => {
    try {
      let _workspaceProperties = { ...this.workspaceProperties };
      if (!_workspaceProperties) _workspaceProperties = {};
      if (!_workspaceProperties[workspaceSlug])
        _workspaceProperties[workspaceSlug] = { filters: {}, displayFilters: {}, displayProperties: {} };

      const _filters = {
        filters: { ..._workspaceProperties[workspaceSlug].filters },
        displayFilters: { ..._workspaceProperties[workspaceSlug].displayFilters },
        displayProperties: { ..._workspaceProperties[workspaceSlug].displayProperties },
      };

      switch (type) {
        case EFilterType.FILTERS:
          _filters.filters = { ..._filters.filters, ...(filters as IIssueFilterOptions) };
          break;
        case EFilterType.DISPLAY_FILTERS:
          _filters.displayFilters = { ..._filters.displayFilters, ...(filters as IIssueDisplayFilterOptions) };
          break;
        case EFilterType.DISPLAY_PROPERTIES:
          _filters.displayProperties = { ..._filters.displayProperties, ...(filters as IIssueDisplayProperties) };
          break;
      }

      _workspaceProperties[workspaceSlug] = {
        ..._workspaceProperties[workspaceSlug],
        filters: _filters?.filters,
        displayFilters: _filters?.displayFilters,
        displayProperties: _filters?.displayProperties,
      };

      runInAction(() => {
        this.workspaceProperties = _workspaceProperties;
      });

      await this.workspaceService.updateWorkspaceView(workspaceSlug, {
        view_props: {
          filters: _filters.filters,
          display_filters: _filters.displayFilters,
          display_properties: _filters.displayProperties,
        },
      });

      return _filters;
    } catch (error) {
      this.fetchWorkspaceProperties(workspaceSlug);
      throw error;
    }
  };

  fetchWorkspaceViewFilters = async (workspaceSlug: string, view: TIssueViewTypes) => {
    try {
      let _workspaceViewFilters = { ...this.workspaceViewFilters };
      if (!_workspaceViewFilters) _workspaceViewFilters = {};
      if (!_workspaceViewFilters[workspaceSlug]) _workspaceViewFilters[workspaceSlug] = {} as IIssueViewOptions;
      if (!_workspaceViewFilters[workspaceSlug][view]) _workspaceViewFilters[workspaceSlug][view] = { filters: {} };

      const filtersResponse = await this.workspaceService.getViewDetails(workspaceSlug, view);

      const _filters: IIssueFilterOptions = {
        assignees: filtersResponse?.query_data?.filters?.assignees || null,
        mentions: filtersResponse?.query_data?.filters?.mentions || null,
        created_by: filtersResponse?.query_data?.filters?.created_by || null,
        labels: filtersResponse?.query_data?.filters?.labels || null,
        priority: filtersResponse?.query_data?.filters?.priority || null,
        project: filtersResponse?.query_data?.filters?.project || null,
        start_date: filtersResponse?.query_data?.filters?.start_date || null,
        state: filtersResponse?.query_data?.filters?.state || null,
        state_group: filtersResponse?.query_data?.filters?.state_group || null,
        subscriber: filtersResponse?.query_data?.filters?.subscriber || null,
        target_date: filtersResponse?.query_data?.filters?.target_date || null,
      };

      _workspaceViewFilters[workspaceSlug][view].filters = { ..._filters };

      runInAction(() => {
        this.workspaceViewFilters = _workspaceViewFilters;
      });

      return _filters;
    } catch (error) {
      throw error;
    }
  };

  updateWorkspaceViewFilters = async (workspaceSlug: string, filters: IIssueFilterOptions) => {
    try {
      let _workspaceViewFilters = { ...this.workspaceViewFilters };
      if (!_workspaceViewFilters) _workspaceViewFilters = {};
      if (!_workspaceViewFilters[workspaceSlug]) _workspaceViewFilters[workspaceSlug] = {} as IIssueViewOptions;
      if (!_workspaceViewFilters[workspaceSlug][this.currentView])
        _workspaceViewFilters[workspaceSlug][this.currentView] = { filters: {} };

      const _filters = {
        filters: { ..._workspaceViewFilters[workspaceSlug][this.currentView].filters, ...filters },
      };

      _workspaceViewFilters[workspaceSlug][this.currentView] = {
        ..._workspaceViewFilters[workspaceSlug][this.currentView],
        filters: _filters?.filters,
      };

      runInAction(() => {
        this.workspaceViewFilters = _workspaceViewFilters;
      });

      await this.workspaceService.updateView(workspaceSlug, this.currentView, {
        query_data: {
          filters: _filters.filters,
        } as any,
      });

      return _filters.filters;
    } catch (error) {
      this.fetchWorkspaceViewFilters(workspaceSlug, this.currentView);
      throw error;
    }
  };

  get issueFilters() {
    const workspaceSlug = this.rootStore.workspace.workspaceSlug;
    if (!workspaceSlug) return undefined;
    const displayFilters = this.issueDisplayFilters(workspaceSlug);

    const _filters: IWorkspaceProperties = {
      filters: displayFilters?.filters || {},
      displayFilters: displayFilters?.displayFilters || {},
      displayProperties: displayFilters?.displayProperties || {},
    };

    return _filters;
  }

  get appliedFilters() {
    const userFilters = this.issueFilters;
    if (!userFilters) return undefined;

    let filteredRouteParams: any = {
      priority: userFilters?.filters?.priority || undefined,
      project: userFilters?.filters?.project || undefined,
      state_group: userFilters?.filters?.state_group || undefined,
      state: userFilters?.filters?.state || undefined,
      assignees: userFilters?.filters?.assignees || undefined,
      mentions: userFilters?.filters?.mentions || undefined,
      created_by: userFilters?.filters?.created_by || undefined,
      labels: userFilters?.filters?.labels || undefined,
      start_date: userFilters?.filters?.start_date || undefined,
      target_date: userFilters?.filters?.target_date || undefined,
      type: userFilters?.displayFilters?.type || undefined,
      sub_issue: false,
    };

    const filteredParams = handleIssueQueryParamsByLayout("spreadsheet", "my_issues");
    if (filteredParams) filteredRouteParams = this.computedFilter(filteredRouteParams, filteredParams);

    return filteredRouteParams;
  }

  fetchFilters = async (workspaceSlug: string, view: TIssueViewTypes) => {
    try {
      await this.fetchWorkspaceProperties(workspaceSlug);
      if (!["all-issues", "assigned", "created", "subscribed"].includes(view))
        await this.fetchWorkspaceViewFilters(workspaceSlug, view);
      return;
    } catch (error) {
      throw Error;
    }
  };

  updateFilters = async (
    workspaceSlug: string,
    filterType: EFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties
  ) => {
    try {
      switch (filterType) {
        case EFilterType.FILTERS:
          if (["all-issues", "assigned", "created", "subscribed"].includes(this.currentView))
            await this.updateWorkspaceProperties(workspaceSlug, filterType, filters as IIssueDisplayFilterOptions);
          else await this.updateWorkspaceViewFilters(workspaceSlug, filters as IIssueFilterOptions);
          break;
        case EFilterType.DISPLAY_FILTERS:
          await this.updateWorkspaceProperties(workspaceSlug, filterType, filters as IIssueDisplayFilterOptions);
          break;
        case EFilterType.DISPLAY_PROPERTIES:
          await this.updateWorkspaceProperties(workspaceSlug, filterType, filters as IIssueDisplayProperties);
          break;
      }

      return;
    } catch (error) {
      throw error;
    }
  };
}

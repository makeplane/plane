import { action, makeObservable, observable, runInAction } from "mobx";
import isEmpty from "lodash/isEmpty";
// types
import { RootStore } from "store/root";
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueParams } from "types";
import { EFilterType } from "store/issues/types";
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";
import { IssueFilterBaseStore } from "../project-issues/base-issue-filter.store";

interface IProjectIssuesFiltersOptions {
  filters: IIssueFilterOptions;
  displayFilters: IIssueDisplayFilterOptions;
}

interface IProjectIssuesDisplayOptions {
  filters: IIssueFilterOptions;
  displayFilters: IIssueDisplayFilterOptions;
  displayProperties: IIssueDisplayProperties;
}

interface IProjectIssuesFilters {
  filters: IIssueFilterOptions | undefined;
  displayFilters: IIssueDisplayFilterOptions | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
}

export interface IProfileIssuesFilterStore {
  // observables
  projectIssueFilters: { [workspaceId: string]: IProjectIssuesDisplayOptions } | undefined;
  // computed
  issueFilters: IProjectIssuesFilters | undefined;
  appliedFilters: TIssueParams[] | undefined;
  // helpers
  issueDisplayFilters: (workspaceId: string) => IProjectIssuesDisplayOptions | undefined;
  // actions
  fetchDisplayFilters: (workspaceSlug: string) => Promise<IProjectIssuesFiltersOptions>;
  updateDisplayFilters: (
    workspaceSlug: string,
    type: EFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions
  ) => Promise<IProjectIssuesFiltersOptions>;
  fetchDisplayProperties: (workspaceSlug: string) => Promise<IIssueDisplayProperties>;
  updateDisplayProperties: (
    workspaceSlug: string,
    properties: IIssueDisplayProperties
  ) => Promise<IIssueDisplayProperties>;
  fetchFilters: (workspaceSlug: string) => Promise<void>;
  updateFilters: (
    workspaceSlug: string,
    filterType: EFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties
  ) => Promise<void>;
}

export class ProfileIssuesFilterStore extends IssueFilterBaseStore implements IProfileIssuesFilterStore {
  // observables
  projectIssueFilters: { [projectId: string]: IProjectIssuesDisplayOptions } | undefined = undefined;
  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
    super(_rootStore);

    makeObservable(this, {
      // observables
      projectIssueFilters: observable.ref,
      // computed
      // actions
      fetchDisplayFilters: action,
      updateDisplayFilters: action,
      fetchDisplayProperties: action,
      updateDisplayProperties: action,
    });
    // root store
    this.rootStore = _rootStore;
  }

  // computed

  // helpers
  issueDisplayFilters = (workspaceId: string) => {
    if (!workspaceId) return undefined;
    return this.projectIssueFilters?.[workspaceId] || undefined;
  };

  // actions
  fetchDisplayFilters = async (workspaceSlug: string) => {
    try {
      const filters: IIssueFilterOptions = {
        assignees: null,
        mentions: null,
        created_by: null,
        labels: null,
        priority: null,
        project: null,
        start_date: null,
        state: null,
        state_group: null,
        subscriber: null,
        target_date: null,
      };

      const displayFilters: IIssueDisplayFilterOptions = {
        calendar: {
          show_weekends: false,
          layout: "month",
        },
        group_by: "state_detail.group",
        sub_group_by: null,
        layout: "list",
        order_by: "-created_at",
        show_empty_groups: false,
        start_target_date: false,
        sub_issue: false,
        type: null,
      };

      const issueFilters: IProjectIssuesFiltersOptions = {
        filters: filters,
        displayFilters: displayFilters,
      };

      let _projectIssueFilters = this.projectIssueFilters;
      if (!_projectIssueFilters) _projectIssueFilters = {};
      if (!_projectIssueFilters[workspaceSlug]) {
        _projectIssueFilters[workspaceSlug] = { displayProperties: {} } as IProjectIssuesDisplayOptions;
      }

      if (
        isEmpty(_projectIssueFilters[workspaceSlug].filters) ||
        isEmpty(_projectIssueFilters[workspaceSlug].displayFilters)
      ) {
        _projectIssueFilters[workspaceSlug] = {
          ..._projectIssueFilters[workspaceSlug],
          ...issueFilters,
        };
      }

      runInAction(() => {
        this.projectIssueFilters = _projectIssueFilters;
      });

      return issueFilters;
    } catch (error) {
      throw error;
    }
  };

  updateDisplayFilters = async (
    workspaceSlug: string,
    type: EFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions
  ) => {
    try {
      let _projectIssueFilters = { ...this.projectIssueFilters };
      if (!_projectIssueFilters) _projectIssueFilters = {};
      if (!_projectIssueFilters[workspaceSlug])
        _projectIssueFilters[workspaceSlug] = { filters: {}, displayFilters: {}, displayProperties: {} };

      const _filters = {
        filters: { ..._projectIssueFilters[workspaceSlug].filters },
        displayFilters: { ..._projectIssueFilters[workspaceSlug].displayFilters },
      };

      if (type === EFilterType.FILTERS) _filters.filters = { ..._filters.filters, ...filters };
      else if (type === EFilterType.DISPLAY_FILTERS)
        _filters.displayFilters = { ..._filters.displayFilters, ...filters };

      // set sub_group_by to null if group_by is set to null
      if (_filters.displayFilters.group_by === null) _filters.displayFilters.sub_group_by = null;

      // set sub_group_by to null if layout is switched to kanban group_by and sub_group_by are same
      if (
        _filters.displayFilters.layout === "kanban" &&
        _filters.displayFilters.group_by === _filters.displayFilters.sub_group_by
      )
        _filters.displayFilters.sub_group_by = null;

      // set group_by to state if layout is switched to kanban and group_by is null
      if (_filters.displayFilters.layout === "kanban" && _filters.displayFilters.group_by === null)
        _filters.displayFilters.group_by = "state";

      _projectIssueFilters[workspaceSlug] = {
        filters: _filters.filters,
        displayFilters: _filters.displayFilters,
        displayProperties: _projectIssueFilters[workspaceSlug].displayProperties,
      };

      runInAction(() => {
        this.projectIssueFilters = _projectIssueFilters;
      });

      return _filters;
    } catch (error) {
      throw error;
    }
  };

  fetchDisplayProperties = async (workspaceSlug: string) => {
    try {
      const displayProperties: IIssueDisplayProperties = {
        assignee: true,
        start_date: true,
        due_date: true,
        labels: true,
        key: true,
        priority: true,
        state: false,
        sub_issue_count: true,
        link: true,
        attachment_count: false,
        estimate: false,
        created_on: false,
        updated_on: false,
      };

      let _projectIssueFilters = { ...this.projectIssueFilters };
      if (!_projectIssueFilters) _projectIssueFilters = {};
      if (!_projectIssueFilters[workspaceSlug]) {
        _projectIssueFilters[workspaceSlug] = { filters: {}, displayFilters: {} } as IProjectIssuesDisplayOptions;
      }
      if (isEmpty(_projectIssueFilters[workspaceSlug].displayProperties)) {
        _projectIssueFilters[workspaceSlug] = {
          ..._projectIssueFilters[workspaceSlug],
          displayProperties: displayProperties,
        };
      }

      runInAction(() => {
        this.projectIssueFilters = _projectIssueFilters;
      });

      return displayProperties;
    } catch (error) {
      throw error;
    }
  };

  updateDisplayProperties = async (workspaceSlug: string, properties: IIssueDisplayProperties) => {
    try {
      let _issueFilters = { ...this.projectIssueFilters };
      if (!_issueFilters) _issueFilters = {};
      if (!_issueFilters[workspaceSlug])
        _issueFilters[workspaceSlug] = { filters: {}, displayFilters: {}, displayProperties: {} };

      const updatedDisplayProperties = { ..._issueFilters[workspaceSlug].displayProperties, ...properties };
      _issueFilters[workspaceSlug] = { ..._issueFilters[workspaceSlug], displayProperties: updatedDisplayProperties };

      runInAction(() => {
        this.projectIssueFilters = _issueFilters;
      });

      return properties;
    } catch (error) {
      throw error;
    }
  };

  get issueFilters() {
    const workspaceSlug = this.rootStore.workspace.workspaceSlug;
    if (!workspaceSlug) return undefined;
    const displayFilters = this.issueDisplayFilters(workspaceSlug);

    const _filters: IProjectIssuesFilters = {
      filters: displayFilters?.filters,
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

    const filteredParams = handleIssueQueryParamsByLayout(userFilters?.displayFilters?.layout, "profile_issues");
    if (filteredParams) filteredRouteParams = this.computedFilter(filteredRouteParams, filteredParams);

    if (userFilters?.displayFilters?.layout === "calendar") filteredRouteParams.group_by = "target_date";
    if (userFilters?.displayFilters?.layout === "gantt_chart") filteredRouteParams.start_target_date = true;

    return filteredRouteParams;
  }

  fetchFilters = async (workspaceSlug: string) => {
    try {
      await this.fetchDisplayFilters(workspaceSlug);
      await this.fetchDisplayProperties(workspaceSlug);
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
          await this.updateDisplayFilters(workspaceSlug, filterType, filters as IIssueFilterOptions);
          break;
        case EFilterType.DISPLAY_FILTERS:
          await this.updateDisplayFilters(workspaceSlug, filterType, filters as IIssueDisplayFilterOptions);
          break;
        case EFilterType.DISPLAY_PROPERTIES:
          await this.updateDisplayProperties(workspaceSlug, filters as IIssueDisplayProperties);
          break;
      }

      return;
    } catch (error) {
      throw error;
    }
  };
}

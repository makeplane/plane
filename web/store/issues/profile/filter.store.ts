import { action, makeObservable, observable, runInAction } from "mobx";
// types
import { RootStore } from "store/root";
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions } from "types";
import { EFilterType } from "store/issues/types";

interface IProjectIssuesFiltersOptions {
  filters: IIssueFilterOptions;
  displayFilters: IIssueDisplayFilterOptions;
}

interface IProjectIssuesDisplayOptions {
  filters: IIssueFilterOptions;
  displayFilters: IIssueDisplayFilterOptions;
  displayProperties: IIssueDisplayProperties;
}

export interface IIssuesFilterStore {
  // observables
  projectIssueFilters: { [projectId: string]: IProjectIssuesDisplayOptions } | undefined;
  // computed
  // helpers
  issueDisplayFilters: (projectId: string) => IProjectIssuesDisplayOptions | undefined;
  // actions
  fetchDisplayFilters: (workspaceSlug: string, projectId: string) => Promise<IProjectIssuesFiltersOptions>;
  updateDisplayFilters: (
    workspaceSlug: string,
    projectId: string,
    type: EFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions
  ) => Promise<IProjectIssuesFiltersOptions>;
  fetchDisplayProperties: (workspaceSlug: string, projectId: string) => Promise<IIssueDisplayProperties>;
  updateDisplayProperties: (
    workspaceSlug: string,
    projectId: string,
    properties: IIssueDisplayProperties
  ) => Promise<IIssueDisplayProperties>;
}

export class IssuesFilterStore implements IIssuesFilterStore {
  // observables
  projectIssueFilters: { [projectId: string]: IProjectIssuesDisplayOptions } | undefined = undefined;
  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
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
  issueDisplayFilters = (projectId: string) => {
    if (!projectId) return undefined;
    return this.projectIssueFilters?.[projectId] || undefined;
  };

  // actions
  fetchDisplayFilters = async (workspaceSlug: string, projectId: string) => {
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
        group_by: null,
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
      if (!_projectIssueFilters[projectId])
        _projectIssueFilters[projectId] = { filters: {}, displayFilters: {}, displayProperties: {} };
      _projectIssueFilters[projectId] = {
        ..._projectIssueFilters[projectId],
        ...issueFilters,
      };

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
    projectId: string,
    type: EFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions
  ) => {
    try {
      let _projectIssueFilters = { ...this.projectIssueFilters };
      if (!_projectIssueFilters) _projectIssueFilters = {};
      if (!_projectIssueFilters[projectId])
        _projectIssueFilters[projectId] = { filters: {}, displayFilters: {}, displayProperties: {} };

      const _filters = {
        filters: { ..._projectIssueFilters[projectId].filters },
        displayFilters: { ..._projectIssueFilters[projectId].displayFilters },
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

      _projectIssueFilters[projectId] = {
        filters: _filters.filters,
        displayFilters: _filters.displayFilters,
        displayProperties: _projectIssueFilters[projectId].displayProperties,
      };

      runInAction(() => {
        this.projectIssueFilters = _projectIssueFilters;
      });

      return _filters;
    } catch (error) {
      this.fetchDisplayFilters(workspaceSlug, projectId);
      throw error;
    }
  };

  fetchDisplayProperties = async (workspaceSlug: string, projectId: string) => {
    try {
      const displayProperties: IIssueDisplayProperties = {
        assignee: false,
        start_date: false,
        due_date: false,
        labels: false,
        key: false,
        priority: false,
        state: false,
        sub_issue_count: false,
        link: false,
        attachment_count: false,
        estimate: false,
        created_on: false,
        updated_on: false,
      };

      let _projectIssueFilters = { ...this.projectIssueFilters };
      if (!_projectIssueFilters) _projectIssueFilters = {};
      if (!_projectIssueFilters[projectId])
        _projectIssueFilters[projectId] = { filters: {}, displayFilters: {}, displayProperties: {} };
      _projectIssueFilters[projectId] = { ..._projectIssueFilters[projectId], displayProperties: displayProperties };

      runInAction(() => {
        this.projectIssueFilters = _projectIssueFilters;
      });

      return displayProperties;
    } catch (error) {
      throw error;
    }
  };

  updateDisplayProperties = async (workspaceSlug: string, projectId: string, properties: IIssueDisplayProperties) => {
    try {
      let _issueFilters = { ...this.projectIssueFilters };
      if (!_issueFilters) _issueFilters = {};
      if (!_issueFilters[projectId])
        _issueFilters[projectId] = { filters: {}, displayFilters: {}, displayProperties: {} };

      const updatedDisplayProperties = { ..._issueFilters[projectId].displayProperties, ...properties };
      _issueFilters[projectId] = { ..._issueFilters[projectId], displayProperties: updatedDisplayProperties };

      runInAction(() => {
        this.projectIssueFilters = _issueFilters;
      });

      return properties;
    } catch (error) {
      this.fetchDisplayProperties(workspaceSlug, projectId);
      throw error;
    }
  };
}

import { action, makeObservable, observable, runInAction } from "mobx";
// services
import { IssueService } from "services/issue";
import { ProjectMemberService, ProjectService } from "services/project";
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
  // services
  projectMemberService;
  projectService;
  issueService;

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
    // services
    this.projectMemberService = new ProjectMemberService();
    this.projectService = new ProjectService();
    this.issueService = new IssueService();
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
      const _filters = await this.projectMemberService.projectMemberMe(workspaceSlug, projectId);

      const filters: IIssueFilterOptions = {
        assignees: _filters?.view_props?.filters?.assignees || null,
        mentions: _filters?.view_props?.filters?.mentions || null,
        created_by: _filters?.view_props?.filters?.created_by || null,
        labels: _filters?.view_props?.filters?.labels || null,
        priority: _filters?.view_props?.filters?.priority || null,
        project: _filters?.view_props?.filters?.project || null,
        start_date: _filters?.view_props?.filters?.start_date || null,
        state: _filters?.view_props?.filters?.state || null,
        state_group: _filters?.view_props?.filters?.state_group || null,
        subscriber: _filters?.view_props?.filters?.subscriber || null,
        target_date: _filters?.view_props?.filters?.target_date || null,
      };

      const displayFilters: IIssueDisplayFilterOptions = {
        calendar: {
          show_weekends: _filters?.view_props?.display_filters?.calendar?.show_weekends || false,
          layout: _filters?.view_props?.display_filters?.calendar?.layout || "month",
        },
        group_by: _filters?.view_props?.display_filters?.group_by || null,
        sub_group_by: _filters?.view_props?.display_filters?.sub_group_by || null,
        layout: _filters?.view_props?.display_filters?.layout || "list",
        order_by: _filters?.view_props?.display_filters?.order_by || "-created_at",
        show_empty_groups: _filters?.view_props?.display_filters?.show_empty_groups || false,
        start_target_date: _filters?.view_props?.display_filters?.start_target_date || false,
        sub_issue: _filters?.view_props?.display_filters?.sub_issue || false,
        type: _filters?.view_props?.display_filters?.type || null,
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

      await this.projectService.setProjectView(workspaceSlug, projectId, {
        view_props: { filters: _filters.filters, display_filters: _filters.displayFilters },
      });

      return _filters;
    } catch (error) {
      this.fetchDisplayFilters(workspaceSlug, projectId);
      throw error;
    }
  };

  fetchDisplayProperties = async (workspaceSlug: string, projectId: string) => {
    try {
      const _issueDisplayProperties = await this.issueService.getIssueDisplayProperties(workspaceSlug, projectId);

      const displayProperties: IIssueDisplayProperties = {
        assignee: _issueDisplayProperties?.properties?.assignee || false,
        start_date: _issueDisplayProperties?.properties?.start_date || false,
        due_date: _issueDisplayProperties?.properties?.due_date || false,
        labels: _issueDisplayProperties?.properties?.labels || false,
        key: _issueDisplayProperties?.properties?.key || false,
        priority: _issueDisplayProperties?.properties?.priority || false,
        state: _issueDisplayProperties?.properties?.state || false,
        sub_issue_count: _issueDisplayProperties?.properties?.sub_issue_count || false,
        link: _issueDisplayProperties?.properties?.link || false,
        attachment_count: _issueDisplayProperties?.properties?.attachment_count || false,
        estimate: _issueDisplayProperties?.properties?.estimate || false,
        created_on: _issueDisplayProperties?.properties?.created_on || false,
        updated_on: _issueDisplayProperties?.properties?.updated_on || false,
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

      await this.issueService.updateIssueDisplayProperties(workspaceSlug, projectId, updatedDisplayProperties);

      return properties;
    } catch (error) {
      this.fetchDisplayProperties(workspaceSlug, projectId);
      throw error;
    }
  };
}

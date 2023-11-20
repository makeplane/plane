import { action, makeObservable, observable, runInAction } from "mobx";
// services
import { IssueService } from "services/issue";
import { ProjectMemberService } from "services/project";
// types
import { RootStore } from "store/root";
import { IIssueDisplayFilterOptions, IIssueDisplayProperties } from "types";

interface IProjectIssueFiltersOptions {
  displayFilters: IIssueDisplayFilterOptions;
  displayProperties: IIssueDisplayProperties;
}

export interface IProjectIssuesDisplayFilterStore {
  // observables
  projectIssueFilters: { [projectId: string]: IProjectIssueFiltersOptions } | undefined;
  // computed
  // helpers
  issueDisplayFilters: (projectId: string) => IProjectIssueFiltersOptions | undefined;
  // actions
  fetchDisplayFilters: (workspaceSlug: string, projectId: string) => Promise<IIssueDisplayFilterOptions>;
  updateDisplayFilters: (workspaceSlug: string, projectId: string, filters: IIssueDisplayFilterOptions) => void;
  fetchDisplayProperties: (workspaceSlug: string, projectId: string) => Promise<IIssueDisplayProperties>;
  updateDisplayProperties: (workspaceSlug: string, projectId: string, properties: IIssueDisplayProperties) => void;
}

export class ProjectIssuesDisplayFilterStore implements IProjectIssuesDisplayFilterStore {
  // observables
  projectIssueFilters: { [projectId: string]: IProjectIssueFiltersOptions } | undefined = undefined;
  // root store
  rootStore;
  // services
  projectMemberService;
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
      const _displayFilters = await this.projectMemberService.projectMemberMe(workspaceSlug, projectId);

      const displayFilters: IIssueDisplayFilterOptions = {
        calendar: {
          show_weekends: _displayFilters?.view_props?.display_filters?.calendar?.show_weekends || false,
          layout: _displayFilters?.view_props?.display_filters?.calendar?.layout || "month",
        },
        group_by: _displayFilters?.view_props?.display_filters?.group_by || null,
        sub_group_by: _displayFilters?.view_props?.display_filters?.sub_group_by || null,
        layout: _displayFilters?.view_props?.display_filters?.layout || "list",
        order_by: _displayFilters?.view_props?.display_filters?.order_by || "-created_at",
        show_empty_groups: _displayFilters?.view_props?.display_filters?.show_empty_groups || false,
        start_target_date: _displayFilters?.view_props?.display_filters?.start_target_date || false,
        sub_issue: _displayFilters?.view_props?.display_filters?.sub_issue || false,
        type: _displayFilters?.view_props?.display_filters?.type || null,
      };

      let _projectIssueFilters = this.projectIssueFilters;
      if (!_projectIssueFilters) _projectIssueFilters = {};
      if (!_projectIssueFilters[projectId])
        _projectIssueFilters[projectId] = { displayFilters: {}, displayProperties: {} };
      _projectIssueFilters[projectId] = { ..._projectIssueFilters[projectId], displayFilters: displayFilters };

      runInAction(() => {
        this.projectIssueFilters = _projectIssueFilters;
      });

      return displayFilters;
    } catch (error) {
      throw error;
    }
  };

  updateDisplayFilters = async (workspaceSlug: string, projectId: string, filters: IIssueDisplayFilterOptions) => {
    try {
      let _projectIssueFilters = this.projectIssueFilters;
      if (!_projectIssueFilters) _projectIssueFilters = {};
      if (!_projectIssueFilters[projectId])
        _projectIssueFilters[projectId] = { displayFilters: {}, displayProperties: {} };
      _projectIssueFilters[projectId] = { ..._projectIssueFilters[projectId], displayFilters: filters };

      runInAction(() => {
        this.projectIssueFilters = _projectIssueFilters;
      });

      // // set sub_group_by to null if group_by is set to null
      // if (displayFilters.group_by === null) displayFilters.sub_group_by = null;

      // // set sub_group_by to null if layout is switched to kanban group_by and sub_group_by are same
      // if (displayFilters.layout === "kanban" && displayFilters.group_by === displayFilters.sub_group_by)
      //   displayFilters.sub_group_by = null;

      // // set group_by to state if layout is switched to kanban and group_by is null
      // if (displayFilters.layout === "kanban" && displayFilters.group_by === null) displayFilters.group_by = "state";

      return filters;
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
        _projectIssueFilters[projectId] = { displayFilters: {}, displayProperties: {} };
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
      if (!_issueFilters[projectId]) _issueFilters[projectId] = { displayFilters: {}, displayProperties: {} };

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

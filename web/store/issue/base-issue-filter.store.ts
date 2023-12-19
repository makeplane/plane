import { action, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
import isEmpty from "lodash/isEmpty";
// types
import { IIssueRootStore } from "./root.store";
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, IIssueFilters } from "types";
// constants
import { EIssueFilterType } from "constants/issue";
// services
import { IssueService } from "services/issue";
import { ProjectMemberService, ProjectService } from "services/project";

export interface IIssuesFilter {
  // observables
  projectIssueFilters: { [projectId: string]: IIssueFilters };
  // helper methods
  issueDisplayFilters: (projectId: string) => IIssueFilters | undefined;
  // actions
  fetchDisplayFilters: (workspaceSlug: string, projectId: string) => Promise<void>;
  updateDisplayFilters: (
    workspaceSlug: string,
    projectId: string,
    type: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions
  ) => Promise<void>;
  fetchDisplayProperties: (workspaceSlug: string, projectId: string) => Promise<void>;
  updateDisplayProperties: (
    workspaceSlug: string,
    projectId: string,
    properties: IIssueDisplayProperties
  ) => Promise<void>;
}

export class IssuesFilter implements IIssuesFilter {
  // observables
  projectIssueFilters: { [projectId: string]: IIssueFilters } = {};
  // root store
  rootStore;
  // services
  projectMemberService;
  projectService;
  issueService;

  constructor(_rootStore: IIssueRootStore) {
    makeObservable(this, {
      // observables
      projectIssueFilters: observable,
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

  // helper methods
  issueDisplayFilters = (projectId: string) => {
    if (!projectId) return undefined;
    return this.projectIssueFilters?.[projectId] || undefined;
  };

  // actions
  fetchDisplayFilters = async (workspaceSlug: string, projectId: string) => {
    try {
      // TODO: replace any and add view_props in the project member types
      const _filters: any = await this.projectMemberService.projectMemberMe(workspaceSlug, projectId);

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

      runInAction(() => {
        set(this.projectIssueFilters, [projectId, "filters"], filters);
        set(this.projectIssueFilters, [projectId, "displayFilters"], displayFilters);
      });
    } catch (error) {
      throw error;
    }
  };

  updateDisplayFilters = async (
    workspaceSlug: string,
    projectId: string,
    type: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions
  ) => {
    try {
      if (isEmpty(this.projectIssueFilters) || isEmpty(this.projectIssueFilters[projectId])) return;

      const _filters = {
        filters: this.projectIssueFilters[projectId].filters as IIssueFilterOptions,
        displayFilters: this.projectIssueFilters[projectId].displayFilters as IIssueDisplayFilterOptions,
      };

      if (type === EIssueFilterType.FILTERS) {
        _filters.filters = { ..._filters.filters, ...filters };

        const updated_filters = filters as IIssueFilterOptions;
        runInAction(() => {
          Object.keys(updated_filters).forEach((_key) => {
            set(
              this.projectIssueFilters,
              [projectId, "filters", _key],
              updated_filters[_key as keyof IIssueFilterOptions]
            );
          });
        });
      } else if (type === EIssueFilterType.DISPLAY_FILTERS) {
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

        const updated_filters = _filters.displayFilters as IIssueDisplayFilterOptions;
        runInAction(() => {
          Object.keys(updated_filters).forEach((_key) => {
            set(
              this.projectIssueFilters,
              [projectId, "displayFilters", _key],
              updated_filters[_key as keyof IIssueDisplayFilterOptions]
            );
          });
        });
      }

      await this.projectService.setProjectView(workspaceSlug, projectId, {
        view_props: { filters: _filters.filters, display_filters: _filters.displayFilters },
      });
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

      runInAction(() => {
        set(this.projectIssueFilters, [projectId, "displayProperties"], displayProperties);
      });
    } catch (error) {
      throw error;
    }
  };

  updateDisplayProperties = async (workspaceSlug: string, projectId: string, properties: IIssueDisplayProperties) => {
    try {
      if (isEmpty(this.projectIssueFilters) || isEmpty(this.projectIssueFilters[projectId])) return;

      runInAction(() => {
        Object.keys(properties).forEach((_key) => {
          set(
            this.projectIssueFilters,
            [projectId, "displayProperties", _key],
            properties[_key as keyof IIssueDisplayProperties]
          );
        });
      });

      await this.issueService.updateIssueDisplayProperties(workspaceSlug, projectId, {
        ...this.projectIssueFilters[projectId]?.displayProperties,
        ...properties,
      });
    } catch (error) {
      this.fetchDisplayProperties(workspaceSlug, projectId);
      throw error;
    }
  };
}

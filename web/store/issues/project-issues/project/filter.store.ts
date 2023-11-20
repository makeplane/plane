import { observable, action, computed, makeObservable, runInAction } from "mobx";
// base class
import { IssueFilterBaseStore } from "store/issues";
// services
import { ProjectService, ProjectMemberService } from "services/project";
// helpers
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";
// types
import { RootStore } from "store/root";
import {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  IProjectViewProps,
  TIssueParams,
} from "types";

interface IProjectIssuesFilterOptions {
  filters: IIssueFilterOptions;
}

interface IProjectIssuesFilters {
  filters: IIssueFilterOptions | undefined;
  displayFilters: IIssueDisplayFilterOptions | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
}

export interface IProjectIssuesFilterStore {
  // observable
  filters: { [projectId: string]: IProjectIssuesFilterOptions } | undefined;
  // computed
  issueFilters: IProjectIssuesFilters | undefined;
  appliedFilters: TIssueParams[] | undefined;
  // actions
  fetchFilters: (workspaceSlug: string, projectId: string) => Promise<IIssueFilterOptions>;
  updateFilters: (
    workspaceSlug: string,
    projectId: string,
    filterToUpdate: Partial<IProjectViewProps>
  ) => Promise<IIssueFilterOptions>;
}

export class ProjectIssuesFilterStore extends IssueFilterBaseStore implements IProjectIssuesFilterStore {
  // observables
  filters: { [projectId: string]: IProjectIssuesFilterOptions } | undefined = undefined;
  // root store
  rootStore;
  // services
  projectService;
  projectMemberService;

  constructor(_rootStore: RootStore) {
    super(_rootStore);

    makeObservable(this, {
      // observables
      filters: observable.ref,
      // computed
      issueFilters: computed,
      appliedFilters: computed,
      // actions
      fetchFilters: action,
      updateFilters: action,
    });

    // root store
    this.rootStore = _rootStore;
    // services
    this.projectService = new ProjectService();
    this.projectMemberService = new ProjectMemberService();
  }

  get issueFilters() {
    const projectId = this.rootStore.project.projectId;
    if (!projectId) return undefined;
    const displayFilters = this.rootStore.projectIssuesDisplayFilter.issueDisplayFilters(projectId);

    const _filters: IProjectIssuesFilters = {
      filters: this.filters?.[projectId]?.filters || undefined,
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

  fetchFilters = async (workspaceSlug: string, projectId: string) => {
    try {
      await this.rootStore.projectIssuesDisplayFilter.fetchDisplayFilters(workspaceSlug, projectId);
      await this.rootStore.projectIssuesDisplayFilter.fetchDisplayProperties(workspaceSlug, projectId);
      const memberResponse = await this.projectMemberService.projectMemberMe(workspaceSlug, projectId);

      const displayFilters: IIssueFilterOptions = {
        assignees: memberResponse?.view_props?.filters?.assignees || null,
        mentions: memberResponse?.view_props?.filters?.mentions || null,
        created_by: memberResponse?.view_props?.filters?.created_by || null,
        labels: memberResponse?.view_props?.filters?.labels || null,
        priority: memberResponse?.view_props?.filters?.priority || null,
        project: memberResponse?.view_props?.filters?.project || null,
        start_date: memberResponse?.view_props?.filters?.start_date || null,
        state: memberResponse?.view_props?.filters?.state || null,
        state_group: memberResponse?.view_props?.filters?.state_group || null,
        subscriber: memberResponse?.view_props?.filters?.subscriber || null,
        target_date: memberResponse?.view_props?.filters?.target_date || null,
      };

      let _filters = { ...this.filters };
      if (!_filters) _filters = {};
      if (!_filters[projectId]) _filters[projectId] = { filters: {} };
      _filters[projectId] = { ..._filters[projectId], filters: displayFilters };

      runInAction(() => {
        this.filters = _filters;
      });

      return displayFilters;
    } catch (error) {
      this.fetchFilters(workspaceSlug, projectId);
      throw error;
    }
  };

  updateFilters = async (workspaceSlug: string, projectId: string, filterToUpdate: Partial<IProjectViewProps>) => {
    try {
      let _filters = { ...this.filters };
      if (!_filters) _filters = {};
      if (!_filters[projectId]) _filters[projectId] = { filters: {} };
      _filters[projectId] = { ..._filters[projectId], filters: { ...filterToUpdate.filters } };

      runInAction(() => {
        this.filters = _filters;
      });

      // const response = await this.projectService.setProjectView(workspaceSlug, projectId, {
      //   view_props: {
      //     filters: updatedPropsPayload.filters,
      //     display_filters: updatedPropsPayload.displayFilters,
      //   },
      // });

      return null as any;
    } catch (error) {
      this.fetchFilters(workspaceSlug, projectId);
      throw error;
    }
  };
}

import { computed, makeObservable } from "mobx";
import isEmpty from "lodash/isEmpty";
// base class
import { IssueFilterHelperStore } from "../helpers/issue-filter-helper.store";
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

export interface IProjectIssuesFilter {
  // computed
  issueFilters: IIssueFilters | undefined;
  appliedFilters: TIssueParams[] | undefined;
  // action
  fetchFilters: (workspaceSlug: string, projectId: string) => Promise<void>;
  updateFilters: (
    workspaceSlug: string,
    projectId: string,
    filterType: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties
  ) => Promise<void>;
}

export class ProjectIssuesFilter extends IssueFilterHelperStore implements IProjectIssuesFilter {
  // root store
  rootStore;

  constructor(_rootStore: IssueRootStore) {
    super(_rootStore);
    makeObservable(this, {
      // computed
      issueFilters: computed,
      appliedFilters: computed,
    });

    // root store
    this.rootStore = _rootStore;
  }

  get issueFilters() {
    const projectId = this.rootStore.projectId;
    if (!projectId) return undefined;

    const displayFilters = this.rootStore.issuesFilter.issueDisplayFilters(projectId);
    if (!projectId || isEmpty(displayFilters)) return undefined;

    const _filters: IIssueFilters = {
      filters: isEmpty(displayFilters?.filters) ? undefined : displayFilters?.filters,
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

  fetchFilters = async (workspaceSlug: string, projectId: string) => {
    try {
      await this.rootStore.issuesFilter.fetchDisplayFilters(workspaceSlug, projectId);
      await this.rootStore.issuesFilter.fetchDisplayProperties(workspaceSlug, projectId);
      return;
    } catch (error) {
      throw Error;
    }
  };

  updateFilters = async (
    workspaceSlug: string,
    projectId: string,
    filterType: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties
  ) => {
    try {
      switch (filterType) {
        case EIssueFilterType.FILTERS:
          await this.rootStore.issuesFilter.updateDisplayFilters(
            workspaceSlug,
            projectId,
            filterType,
            filters as IIssueFilterOptions
          );
          this.rootStore.projectIssues.fetchIssues(workspaceSlug, projectId, "mutation");
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
      throw error;
    }
  };
}

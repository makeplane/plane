import { observable, action, makeObservable, runInAction, computed } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { SitesViewPublishService } from "@plane/services";
import { IIssueFilterOptions, IProjectView } from "@plane/types";
// store
import { RootStore } from "@/plane-web/store/root.store";
import {
  EIssueLayoutTypes,
  FILTERS_TO_PROPERTIES_MAP,
  ISSUE_FILTERS_BY_LAYOUT,
  ISSUE_MULTIPLE_DATA,
  REQUIRED_ISSUE_DATA,
} from "../../constants/issue";

export interface IProjectViewStore {
  // observables
  viewData: IProjectView | undefined;
  // computed
  possibleFiltersForView: { [key in keyof IIssueFilterOptions]: boolean | string[] } | undefined;
  requiredData: { [key in keyof IIssueFilterOptions]: boolean } | undefined;
  getViewData: () => IProjectView | undefined;
  // fetch actions
  fetchViewDetails: (anchor: string) => Promise<IProjectView>;
}

export class ProjectViewStore implements IProjectViewStore {
  viewData: IProjectView | undefined = undefined;
  // root store
  rootStore;
  // services
  viewPublishService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      viewData: observable,
      // computed
      possibleFiltersForView: computed,
      requiredData: computed,
      // fetch actions
      fetchViewDetails: action,
    });
    // root store
    this.rootStore = _rootStore;
    // services
    this.viewPublishService = new SitesViewPublishService();
  }

  /**
   * Returns view details by id
   */
  getViewData = computedFn(() => this.viewData);

  get possibleFiltersForView() {
    const filters = this.viewData?.filters;
    const displayFilters = this.viewData?.display_filters;
    const displayProperties = this.viewData?.display_properties;

    if (!filters || !displayFilters || !displayProperties) return;

    const filtersDetails = ISSUE_FILTERS_BY_LAYOUT[displayFilters?.layout as EIssueLayoutTypes];

    if (!filtersDetails) return;

    const groupBy = filtersDetails.canGroup ? displayFilters.group_by : undefined;
    const subGroupBy = filtersDetails.canSubGroup ? displayFilters.sub_group_by : undefined;

    const layoutFilters = filtersDetails.filters;

    const filtersMap: { [key in keyof IIssueFilterOptions]: string[] | boolean } = {};

    for (const filterKey of layoutFilters) {
      const displayPropertyKey = FILTERS_TO_PROPERTIES_MAP[filterKey];

      // If the property is Chosen to not be displayed, then do not add the filterKey
      if (!displayPropertyKey || !displayProperties[displayPropertyKey]) continue;

      // // If the property is groupedBy or subGroupedBy, then do not add the filterKey
      if (filterKey === groupBy && filterKey === subGroupBy) continue;

      const appliedFilter = filters[filterKey];
      const isFilterTypeMultiple = ISSUE_MULTIPLE_DATA[filterKey];

      // If no filter is Applied for the key or if the filter type is a multiple property then Show all the Data for filtering
      if (!appliedFilter || isFilterTypeMultiple) {
        filtersMap[filterKey] = true;
        continue;
      }

      // If the applied filter is more than 1 then,
      if (appliedFilter.length > 1) {
        filtersMap[filterKey] = [...appliedFilter];
      }
    }

    return filtersMap;
  }

  get requiredData() {
    const filters = this.viewData?.filters;
    const displayFilters = this.viewData?.display_filters;
    const displayProperties = this.viewData?.display_properties;

    if (!filters || !displayFilters || !displayProperties) return;

    const filtersDetails = ISSUE_FILTERS_BY_LAYOUT[displayFilters.layout as EIssueLayoutTypes];

    if (!filtersDetails) return;

    const groupBy = filtersDetails.canGroup ? displayFilters.group_by : undefined;
    const subGroupBy = filtersDetails.canSubGroup ? displayFilters.sub_group_by : undefined;

    const dataToFetch: { [key in keyof IIssueFilterOptions]: boolean } = {};
    for (const filterKey of REQUIRED_ISSUE_DATA) {
      const displayPropertyKey = FILTERS_TO_PROPERTIES_MAP[filterKey];

      // Check if the Data is displayed
      const isDisplayed = displayPropertyKey && displayProperties[displayPropertyKey];

      // Check if data is used to groupBy or subGroupBy
      const isGroupedBy = filterKey === groupBy || filterKey === subGroupBy;

      dataToFetch[filterKey] = isDisplayed || isGroupedBy;
    }

    return dataToFetch;
  }

  /**
   * Fetches view details for a specific view
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @returns Promise<IProjectView>
   */
  fetchViewDetails = async (anchor: string): Promise<IProjectView> =>
    await this.viewPublishService.retrieve(anchor).then((response) => {
      runInAction(() => {
        this.viewData = response;
      });
      return response;
    });
}

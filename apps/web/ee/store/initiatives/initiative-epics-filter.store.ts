import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { EIssueFilterType } from "@plane/constants";
import {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  ISubWorkItemFilters,
  TIssue,
} from "@plane/types";
import {
  getFilteredWorkItems,
  getGroupedWorkItemIds,
  updateSubWorkItemFilters,
} from "@/store/issue/helpers/base-issues-utils";
import { DEFAULT_DISPLAY_PROPERTIES } from "@/store/issue/issue-details/sub_issues_filter.store";
import { InitiativeEpicStore } from "./initiative-epics.store";

export interface IInitiativeEpicsFilterStore {
  initiativeEpicsFiltersMap: Record<string, Partial<ISubWorkItemFilters>>;
  getInitiativeEpicsFiltersById: (initiativeId: string) => Partial<ISubWorkItemFilters> | undefined;
  updateEpicsFilters: (
    workspaceSlug: string,
    filterType: EIssueFilterType,
    filters: IIssueDisplayFilterOptions | IIssueDisplayProperties,
    initiativeId: string
  ) => Promise<void>;
  getGroupedEpics: (initiativeId: string) => Record<string, string[]>;
  getFilteredEpics: (initiativeId: string, filters: IIssueFilterOptions) => TIssue[];
  resetFilters: (workItemId: string) => void;
  // store
  initiativeEpicStore: InitiativeEpicStore;
}

export class InitiativeEpicsFilterStore implements IInitiativeEpicsFilterStore {
  initiativeEpicsFiltersMap: Record<string, Partial<ISubWorkItemFilters>> = {};
  initiativeEpicStore: InitiativeEpicStore;

  constructor(initiativeEpicStore: InitiativeEpicStore) {
    makeObservable(this, {
      initiativeEpicsFiltersMap: observable,
      updateEpicsFilters: action,
      getInitiativeEpicsFiltersById: action,
      getGroupedEpics: action,
      getFilteredEpics: action,
      resetFilters: action,
    });

    this.initiativeEpicStore = initiativeEpicStore;
  }

  /**
   * Initialize the initiative epics filters
   * @param initiativeId - The initiative id
   */
  initializeFilters = (initiativeId: string) => {
    set(this.initiativeEpicsFiltersMap, [initiativeId, "displayProperties"], DEFAULT_DISPLAY_PROPERTIES);
    set(this.initiativeEpicsFiltersMap, [initiativeId, "filters"], {});
    set(this.initiativeEpicsFiltersMap, [initiativeId, "displayFilters"], {});
  };

  /**
   * Return epics filters for an initiative
   * @param initiativeId
   * @returns filters map
   */
  getInitiativeEpicsFiltersById = (initiativeId: string) => {
    // initialize the filters if no exists before
    if (!this.initiativeEpicsFiltersMap?.[initiativeId]) {
      this.initializeFilters(initiativeId);
    }
    return this.initiativeEpicsFiltersMap?.[initiativeId];
  };

  /**
   * Update the initiative epics filters
   * @param workspaceSlug - The workspace slug
   * @param filterType - The filter type
   * @param filters - The filters
   * @param initiativeId - The initiative id
   */
  updateEpicsFilters = async (
    workspaceSlug: string,
    filterType: EIssueFilterType,
    filters: IIssueDisplayFilterOptions | IIssueDisplayProperties,
    initiativeId: string
  ) => {
    runInAction(() => {
      updateSubWorkItemFilters(this.initiativeEpicsFiltersMap, filterType, filters, initiativeId);
    });
  };

  /**
   * @description This method is used to get the grouped epics
   * @param parentWorkItemId
   * @returns
   */
  getGroupedEpics = computedFn((parentWorkItemId: string) => {
    const epicsFilters = this.getInitiativeEpicsFiltersById(parentWorkItemId);
    // get group by and order by
    const orderByKey = epicsFilters.displayFilters?.order_by;
    const groupByKey = epicsFilters.displayFilters?.group_by;

    const filteredEpics = this.getFilteredEpics(parentWorkItemId, epicsFilters.filters ?? {});

    const groupedEpics = getGroupedWorkItemIds(filteredEpics, groupByKey, orderByKey);

    return groupedEpics;
  });

  /**
   * @description This method is used to get the filtered epics
   * @param initiativeId
   * @returns
   */
  getFilteredEpics = computedFn((initiativeId: string, filters: IIssueFilterOptions) => {
    const epicIds = this.initiativeEpicStore.getInitiativeEpicsById(initiativeId);
    const epics = this.initiativeEpicStore.rootStore.issue.issues.getIssuesByIds(epicIds, "un-archived");

    const filteredEpics = getFilteredWorkItems(epics, filters);

    return filteredEpics;
  });

  /**
   * @description This method is used to reset the filters
   * @param initiativeId
   */
  resetFilters = (initiativeId: string) => {
    this.initializeFilters(initiativeId);
  };
}

import set from "lodash/set";
import { action, makeObservable, observable } from "mobx";
import { EIssueFilterType } from "@plane/constants";
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilters, TIssueParams } from "@plane/types";
import { InitiativeEpicStore } from "./initiative-epics.store";

export interface IInitiativeEpicsFilterStore {
  initiativeEpicsFiltersMap: Record<string, Partial<IIssueFilters>>;
  getInitiativeEpicsFiltersById: (initiativeId: string) => Partial<IIssueFilters> | undefined;
  updateSubIssueFilters: (
    workspaceSlug: string,
    filterType: EIssueFilterType,
    filters: IIssueDisplayFilterOptions | IIssueDisplayProperties,
    initiativeId: string
  ) => Promise<void>;

  // helpers
  computedFilterParams: (initiativeId: string) => Partial<Record<TIssueParams, boolean | string>>;

  // store
  initiativeEpicStore: InitiativeEpicStore;
}

export class InitiativeEpicsFilterStore implements IInitiativeEpicsFilterStore {
  initiativeEpicsFiltersMap: Record<string, Partial<IIssueFilters>> = {};
  initiativeEpicStore: InitiativeEpicStore;

  constructor(initiativeEpicStore: InitiativeEpicStore) {
    makeObservable(this, {
      initiativeEpicsFiltersMap: observable,
      updateSubIssueFilters: action,
      getInitiativeEpicsFiltersById: action,
    });

    this.initiativeEpicStore = initiativeEpicStore;
  }

  /**
   * Initialize the initiative epics filters
   * @param initiativeId - The initiative id
   */
  initInitiativeEpicsFilters = (initiativeId: string) => {
    set(this.initiativeEpicsFiltersMap, [initiativeId], {
      displayFilters: {},
      displayProperties: {
        key: true,
        issue_type: true,
        assignee: true,
        start_date: true,
        due_date: true,
        labels: true,
        priority: true,
        state: true,
      },
    });
  };

  /**
   * Return epics filters for an initiative
   * @param initiativeId
   * @returns filters map
   */
  getInitiativeEpicsFiltersById = (initiativeId: string) => {
    // initialize the filters if no exists before
    if (!this.initiativeEpicsFiltersMap?.[initiativeId]) {
      this.initInitiativeEpicsFilters(initiativeId);
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
  updateSubIssueFilters = async (
    workspaceSlug: string,
    filterType: EIssueFilterType,
    filters: IIssueDisplayFilterOptions | IIssueDisplayProperties,
    initiativeId: string
  ) => {
    const _filters = this.getInitiativeEpicsFiltersById(initiativeId);
    switch (filterType) {
      case EIssueFilterType.DISPLAY_FILTERS: {
        set(this.initiativeEpicsFiltersMap, [initiativeId, "displayFilters"], {
          ..._filters.displayFilters,
          ...filters,
        });
        this.initiativeEpicStore.fetchInitiativeEpics(workspaceSlug, initiativeId);
        break;
      }
      case EIssueFilterType.DISPLAY_PROPERTIES:
        set(this.initiativeEpicsFiltersMap, [initiativeId, "displayProperties"], {
          ..._filters.displayProperties,
          ...filters,
        });
        break;
    }
  };

  /**
   * Compute the filter params for the initiative epics
   * @param initiativeId - The initiative id
   * @returns The computed filter params
   */
  computedFilterParams = (initiativeId: string) => {
    const displayFilters = this.getInitiativeEpicsFiltersById(initiativeId).displayFilters;

    const computedFilters: Partial<Record<TIssueParams, undefined | string[] | boolean | string>> = {
      order_by: displayFilters?.order_by || undefined,
    };

    const issueFiltersParams: Partial<Record<TIssueParams, boolean | string>> = {};
    Object.keys(computedFilters).forEach((key) => {
      const _key = key as TIssueParams;
      const _value: string | boolean | string[] | undefined = computedFilters[_key];
      const nonEmptyArrayValue = Array.isArray(_value) && _value.length === 0 ? undefined : _value;
      if (nonEmptyArrayValue != undefined)
        issueFiltersParams[_key] = Array.isArray(nonEmptyArrayValue)
          ? nonEmptyArrayValue.join(",")
          : nonEmptyArrayValue;
    });

    return issueFiltersParams;
  };
}

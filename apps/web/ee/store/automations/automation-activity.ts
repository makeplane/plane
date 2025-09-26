import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { TAutomationActivity, TAutomationActivityFilters } from "@plane/types";
// local imports
import type { TAutomationHelpers } from "./automation";

export interface IAutomationActivityStore {
  // observables
  filters: TAutomationActivityFilters;
  // helpers
  filtersFetchKey: string;
  hasFetchedActivities: boolean;
  activityIds: string[] | undefined;
  activitiesCount: number;
  getActivityById: (id: string) => TAutomationActivity | undefined;
  checkIfActivityIsFirst: (id: string) => boolean;
  checkIfActivityIsLast: (id: string) => boolean;
  // actions
  fetchActivities: () => Promise<TAutomationActivity[]>;
  updateFilters: (updatedFilters: Partial<TAutomationActivityFilters>) => void;
}

export class AutomationActivityStore implements IAutomationActivityStore {
  // observables
  filters: TAutomationActivityFilters = {
    show_fails: true,
    type: "all",
  };
  private activityData: TAutomationActivity[] | undefined = undefined;
  // helpers
  private helpers: TAutomationHelpers["activityHelpers"];

  constructor(helpers: TAutomationHelpers["activityHelpers"]) {
    // initialize helpers
    this.helpers = helpers;

    makeObservable<AutomationActivityStore, "activityData">(this, {
      // observables
      filters: observable,
      activityData: observable,
      // computed
      filtersFetchKey: computed,
      hasFetchedActivities: computed,
      activityIds: computed,
      activitiesCount: computed,
      // actions
      fetchActivities: action,
      updateFilters: action,
    });
  }

  /**
   * @description The key to fetch the activities
   * @returns {string}
   */
  get filtersFetchKey(): IAutomationActivityStore["filtersFetchKey"] {
    return JSON.stringify(this.filters);
  }

  /**
   * @description Whether the activities have been fetched
   * @returns {boolean}
   */
  get hasFetchedActivities(): IAutomationActivityStore["hasFetchedActivities"] {
    return !!this.activityData;
  }

  /**
   * @description The ids of the activities
   * @returns {string[]}
   */
  get activityIds(): IAutomationActivityStore["activityIds"] {
    return this.activityData?.map((a) => a.id);
  }

  /**
   * @description The number of activities
   * @returns {number}
   */
  get activitiesCount(): IAutomationActivityStore["activitiesCount"] {
    return this.activityIds?.length ?? 0;
  }

  /**
   * @description Get an activity by its id
   * @param {string} id - The id of the activity
   * @returns {TAutomationActivity | undefined}
   */
  getActivityById: IAutomationActivityStore["getActivityById"] = computedFn((id) =>
    this.activityData?.find((a) => a.id === id)
  );

  /**
   * @description Check if the activity is the first
   * @param {string} id - The id of the activity
   * @returns {boolean}
   */
  checkIfActivityIsFirst: IAutomationActivityStore["checkIfActivityIsFirst"] = computedFn(
    (id) => this.activityIds?.[0] === id
  );

  /**
   * @description Check if the activity is the last
   * @param {string} id - The id of the activity
   * @returns {boolean}
   */
  checkIfActivityIsLast: IAutomationActivityStore["checkIfActivityIsLast"] = computedFn(
    (id) => this.activityIds?.[this.activityIds.length - 1] === id
  );

  /**
   * @description Fetch the activities
   */
  fetchActivities: IAutomationActivityStore["fetchActivities"] = async () => {
    try {
      const { show_fails, type } = this.filters;
      // make api call
      const res = await this.helpers.actions.fetch({
        show_fails,
        ...(type !== "all" && { type }),
      });
      if (!res) throw new Error("No response found");
      // update observable
      runInAction(() => {
        this.activityData = res;
      });
      return res;
    } catch (error) {
      console.error("Error in fetching automation activities:", error);
      throw error;
    }
  };

  /**
   * @description Update the filters
   * @param {Partial<TAutomationActivityFilters>} updatedFilters - The filters to update
   */
  updateFilters: IAutomationActivityStore["updateFilters"] = (updatedFilters) => {
    runInAction(() => {
      Object.keys(updatedFilters).forEach((key) => {
        const filterKey = key as keyof TAutomationActivityFilters;
        set(this.filters, filterKey, updatedFilters[filterKey]);
      });
    });
  };
}

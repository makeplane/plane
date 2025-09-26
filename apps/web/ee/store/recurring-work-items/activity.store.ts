import { concat, orderBy, uniq } from "lodash-es";
import { action, autorun, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { E_SORT_ORDER } from "@plane/constants";
import { RecurringWorkItemServiceBase } from "@plane/services";
import { TLoader, TRecurringWorkItemActivity } from "@plane/types";

export interface IRecurringWorkItemActivityStore {
  // observables
  recurringWorkItemActivitySortOrder: E_SORT_ORDER | undefined;
  recurringWorkItemActivityLoader: Map<string, TLoader>; // recurringWorkItemId => loader
  recurringWorkItemActivityMap: Map<string, TRecurringWorkItemActivity[]>; // recurringWorkItemId => recurringWorkItemActivity
  // computed functions
  getRecurringWorkItemActivitySortOrder: () => E_SORT_ORDER;
  getRecurringWorkItemActivityLoader: (recurringWorkItemId: string) => TLoader | undefined;
  getRecurringWorkItemActivities: (recurringWorkItemId: string) => TRecurringWorkItemActivity[] | undefined;
  // helper actions
  toggleRecurringWorkItemActivitySortOrder: () => void;
  // actions
  fetchRecurringWorkItemActivities: (
    workspaceSlug: string,
    projectId: string,
    recurringWorkItemId: string
  ) => Promise<void>;
}

export class RecurringWorkItemActivityStore implements IRecurringWorkItemActivityStore {
  // observables
  recurringWorkItemActivitySortOrder: IRecurringWorkItemActivityStore["recurringWorkItemActivitySortOrder"] = undefined;
  recurringWorkItemActivityLoader: IRecurringWorkItemActivityStore["recurringWorkItemActivityLoader"] = new Map();
  recurringWorkItemActivityMap: IRecurringWorkItemActivityStore["recurringWorkItemActivityMap"] = new Map();
  // recurring work item service
  private recurringWorkItemService: RecurringWorkItemServiceBase;

  // constructor
  constructor() {
    // recurring work item service
    this.recurringWorkItemService = new RecurringWorkItemServiceBase();

    makeObservable(this, {
      // observables
      recurringWorkItemActivitySortOrder: observable,
      recurringWorkItemActivityLoader: observable,
      recurringWorkItemActivityMap: observable,
      // actions
      toggleRecurringWorkItemActivitySortOrder: action,
      fetchRecurringWorkItemActivities: action,
    });

    // autorun to get or set recurring work item activity sort order to local storage
    autorun(() => {
      if (typeof localStorage === "undefined") return;
      if (this.recurringWorkItemActivitySortOrder === undefined) {
        // Initialize sort order if not set
        const storedSortOrder =
          (localStorage.getItem(`recurring-work-item-activity-sort-order`) as E_SORT_ORDER | undefined) ??
          E_SORT_ORDER.DESC;
        this.recurringWorkItemActivitySortOrder = storedSortOrder;
      } else {
        // Update local storage if sort order is set
        localStorage.setItem(`recurring-work-item-activity-sort-order`, this.recurringWorkItemActivitySortOrder);
      }
    });
  }

  // computed functions
  /**
   * Get recurring work item activity sort order
   */
  getRecurringWorkItemActivitySortOrder = computedFn(
    () => this.recurringWorkItemActivitySortOrder ?? E_SORT_ORDER.DESC
  );

  /**
   * Get recurring work item activity loader
   * @param recurringWorkItemId
   */
  getRecurringWorkItemActivityLoader = computedFn((recurringWorkItemId: string) =>
    this.recurringWorkItemActivityLoader.get(recurringWorkItemId)
  );

  /**
   * Get recurring work item activities
   * @param recurringWorkItemId
   */
  getRecurringWorkItemActivities = computedFn((recurringWorkItemId: string) =>
    orderBy(
      this.recurringWorkItemActivityMap.get(recurringWorkItemId),
      "created_at",
      this.recurringWorkItemActivitySortOrder
    )
  );

  // helper actions
  /**
   * Toggle recurring work item activity sort order
   */
  toggleRecurringWorkItemActivitySortOrder = () => {
    this.recurringWorkItemActivitySortOrder =
      this.recurringWorkItemActivitySortOrder === E_SORT_ORDER.ASC ? E_SORT_ORDER.DESC : E_SORT_ORDER.ASC;
  };

  /**
   * Merge recurring work item activities
   * @param currentRecurringWorkItemActivities
   * @param newRecurringWorkItemActivities
   */
  mergeRecurringWorkItemActivities = (
    currentRecurringWorkItemActivities: TRecurringWorkItemActivity[],
    newRecurringWorkItemActivities: TRecurringWorkItemActivity[]
  ) => {
    // Create a map for lookups of new workflow change history
    const newRecurringWorkItemActivitiesMap = new Map(
      newRecurringWorkItemActivities.map((activity) => [activity.id, activity])
    );

    // Update existing workflow change history if they exist in new workflow change history
    const updatedRecurringWorkItemActivities = currentRecurringWorkItemActivities.map((activity) => {
      const matchingNewActivity = newRecurringWorkItemActivitiesMap.get(activity.id);
      return matchingNewActivity
        ? {
            ...activity,
            created_at: matchingNewActivity.created_at,
          }
        : activity;
    });

    // Find workflow change history that don't exist in current workflow change history
    const existingIdsSet = new Set(currentRecurringWorkItemActivities.map((activity) => activity.id));
    const recurringWorkItemActivitiesToAdd = newRecurringWorkItemActivities.filter(
      (activity) => !existingIdsSet.has(activity.id)
    );

    // Combine and deduplicate
    return uniq(concat(updatedRecurringWorkItemActivities, recurringWorkItemActivitiesToAdd));
  };

  // actions
  /**
   * Fetch recurring work item activities
   * @param workspaceSlug
   * @param projectId
   * @param recurringWorkItemId
   */
  fetchRecurringWorkItemActivities = async (workspaceSlug: string, projectId: string, recurringWorkItemId: string) => {
    try {
      // Generate props
      let props = {};
      // Get the current recurring work item activities
      const currentRecurringWorkItemActivities = this.recurringWorkItemActivityMap.get(recurringWorkItemId);
      // If there is a current recurring work item activities, set the props to the last created_at date
      if (currentRecurringWorkItemActivities && currentRecurringWorkItemActivities.length > 0) {
        // set the loader
        this.recurringWorkItemActivityLoader.set(recurringWorkItemId, "mutation");
        // Get the last recurring work item activity
        const currentActivity = currentRecurringWorkItemActivities[currentRecurringWorkItemActivities.length - 1];
        if (currentActivity) props = { created_at__gt: currentActivity.created_at };
      } else {
        this.recurringWorkItemActivityLoader.set(recurringWorkItemId, "init-loader");
      }
      // Fetch the recurring work item activities
      const recurringWorkItemActivities = await this.recurringWorkItemService.listActivities(
        workspaceSlug,
        projectId,
        recurringWorkItemId,
        props
      );
      runInAction(() => {
        const existingRecurringWorkItemActivities = this.recurringWorkItemActivityMap.get(recurringWorkItemId);
        if (!existingRecurringWorkItemActivities) {
          this.recurringWorkItemActivityMap.set(recurringWorkItemId, recurringWorkItemActivities);
        } else {
          this.recurringWorkItemActivityMap.set(
            recurringWorkItemId,
            this.mergeRecurringWorkItemActivities(existingRecurringWorkItemActivities, recurringWorkItemActivities)
          );
        }
      });
    } catch (e) {
      console.log("error while fetching recurring work item activities", e);
    } finally {
      this.recurringWorkItemActivityLoader.set(recurringWorkItemId, "loaded");
    }
  };
}

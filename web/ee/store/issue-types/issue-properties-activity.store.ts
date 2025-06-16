import isEmpty from "lodash/isEmpty";
import orderBy from "lodash/orderBy";
import set from "lodash/set";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { TLoader, TIssuePropertiesActivity, IIssuePropertiesActivity, IIssuePropertiesActivityStore } from "@plane/types";
// helpers
import { convertToEpoch  } from "@plane/utils";
// plane web services
import { IssuePropertiesActivityService } from "@/plane-web/services/issue-types";
// plane web store
import { IssuePropertiesActivity } from "@/plane-web/store/issue-types";
import { RootStore } from "@/plane-web/store/root.store";

export class IssuePropertiesActivityStore implements IIssuePropertiesActivityStore {
  // observables
  loader: TLoader = "init-loader";
  propertyActivities: Record<string, IIssuePropertiesActivity> = {};
  // services
  service: IssuePropertiesActivityService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      propertyActivities: observable,
      // actions
      fetchPropertyActivities: action,
    });
    // services
    this.service = new IssuePropertiesActivityService();
  }

  // computed functions
  /**
   * Get property activity ids by issue id
   * @param issueId
   * @returns property activity ids
   */
  getPropertyActivityIdsByIssueId = computedFn((issueId: string) => {
    if (!issueId || isEmpty(this.propertyActivities)) return undefined;
    const issuePropertyActivityIds = orderBy(
      Object.values(this.propertyActivities || []),
      (w) => convertToEpoch(w.created_at),
      ["desc"]
    )
      .filter((activity) => activity.id && activity.issue === issueId)
      .map((activity) => activity.id) as string[];
    return issuePropertyActivityIds;
  });

  /**
   * Get property activity by id
   * @param activityId
   * @returns property activity
   */
  getPropertyActivityById = computedFn((activityId: string) => {
    if (!activityId) return undefined;
    return this.propertyActivities[activityId] ?? undefined;
  });

  // helper actions
  /**
   * Add or update property activity
   * @param activities property activities
   */
  addOrUpdatePropertyActivity = (activities: TIssuePropertiesActivity[]) => {
    for (const activity of activities) {
      if (!activity.id) continue;
      const existingActivity = this.getPropertyActivityById(activity.id);
      if (existingActivity) {
        // update existing activity with new data
        existingActivity.updateActivityData(activity);
      } else {
        // add new activity
        set(this.propertyActivities, activity.id, new IssuePropertiesActivity(this.store, activity));
      }
    }
  };

  // actions
  fetchPropertyActivities = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    loaderType: TLoader = "init-loader"
  ) => {
    try {
      this.loader = loaderType;
      // get last activity created_at timestamp
      let params = {};
      const currentActivityIds = this.getPropertyActivityIdsByIssueId(issueId);
      if (currentActivityIds && currentActivityIds.length > 0) {
        const currentActivity = this.getPropertyActivityById(currentActivityIds[0]); // getPropertyActivityIdsByIssueId returns sorted activities by created_at
        if (currentActivity) params = { created_at__gt: currentActivity.created_at };
      }
      // fetch property activities after last activity created_at timestamp
      const issuePropertiesActivities = await this.service.fetchAll(workspaceSlug, projectId, issueId, params);
      if (issuePropertiesActivities) {
        runInAction(() => {
          this.addOrUpdatePropertyActivity(issuePropertiesActivities);
        });
      }
      this.loader = "loaded";
      return issuePropertiesActivities;
    } catch (error) {
      this.loader = "loaded";
      console.error("IssuePropertiesActivityStore -> fetchPropertyActivities -> error", error);
      throw error;
    }
  };
}

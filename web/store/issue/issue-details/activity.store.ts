import { action, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// services
import { IssueService } from "services/issue";
// types
import { IIssueDetail } from "./root.store";
import { IIssueActivity } from "types";

export interface IIssueActivityStoreActions {
  // actions
  fetchActivities: (workspaceSlug: string, projectId: string, issueId: string) => Promise<IIssueActivity[]>;
}

export interface IIssueActivityStore extends IIssueActivityStoreActions {
  // observables
  activities: Record<string, string[]>; // Record defines issueId as key and  activityId's as value
  activityMap: Record<string, IIssueActivity>; // Record defines activityId as key and activities as value
  // helper methods
  getActivitiesByIssueId: (issueId: string) => string[] | undefined;
  getActivityById: (activityId: string) => IIssueActivity | undefined;
}

export class IssueActivityStore implements IIssueActivityStore {
  // observables
  activities: Record<string, string[]> = {};
  activityMap: Record<string, IIssueActivity> = {};
  // root store
  rootIssueDetailStore: IIssueDetail;
  // services
  issueService;

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {
      // observables
      activities: observable,
      activityMap: observable,
      // actions
      fetchActivities: action,
    });
    // root store
    this.rootIssueDetailStore = rootStore;
    // services
    this.issueService = new IssueService();
  }

  // helper methods
  getActivitiesByIssueId = (issueId: string) => {
    if (!issueId) return undefined;
    return this.activities[issueId] ?? undefined;
  };

  getActivityById = (activityId: string) => {
    if (!activityId) return undefined;
    return this.activityMap[activityId] ?? undefined;
  };

  // actions
  fetchActivities = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const activities = await this.issueService.getIssueActivities(workspaceSlug, projectId, issueId);

      console.log("activities", activities);

      const activityIds = activities.map((activity) => activity.id);
      runInAction(() => {
        set(this.activities, issueId, activityIds);
        activities.forEach((activity) => {
          set(this.activityMap, activity.id, activity);
        });
      });

      return activities;
    } catch (error) {
      throw error;
    }
  };
}

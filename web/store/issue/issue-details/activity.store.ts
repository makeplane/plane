import { action, computed, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// services
import { IssueService } from "services/issue";
// types
import { IIssueDetail } from "./root.store";
import { TIssueActivity, TIssueActivityIdMap, TIssueActivityMap } from "@plane/types";

export interface IIssueActivityStoreActions {
  // actions
  fetchActivities: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueActivity[]>;
}

export interface IIssueActivityStore extends IIssueActivityStoreActions {
  // observables
  activities: TIssueActivityIdMap;
  activityMap: TIssueActivityMap;
  // computed
  issueActivities: string[] | undefined;
  // helper methods
  getActivitiesByIssueId: (issueId: string) => string[] | undefined;
  getActivityById: (activityId: string) => TIssueActivity | undefined;
}

export class IssueActivityStore implements IIssueActivityStore {
  // observables
  activities: TIssueActivityIdMap = {};
  activityMap: TIssueActivityMap = {};
  // root store
  rootIssueDetailStore: IIssueDetail;
  // services
  issueService;

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {
      // observables
      activities: observable,
      activityMap: observable,
      // computed
      issueActivities: computed,
      // actions
      fetchActivities: action,
    });
    // root store
    this.rootIssueDetailStore = rootStore;
    // services
    this.issueService = new IssueService();
  }

  // computed
  get issueActivities() {
    const issueId = this.rootIssueDetailStore.peekIssue?.issueId;
    if (!issueId) return undefined;
    return this.activities[issueId] ?? undefined;
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

/* eslint-disable no-useless-catch */

import concat from "lodash/concat";
import orderBy from "lodash/orderBy";
import set from "lodash/set";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { TIssueActivityComment, TIssueActivity, TIssueActivityMap, TIssueActivityIdMap } from "@plane/types";
// plane web constants
import { EActivityFilterType } from "@/plane-web/constants/issues";
// services
import { IssueActivityService } from "@/services/issue";
// store
import { CoreRootStore } from "@/store/root.store";

export type TActivityLoader = "fetch" | "mutate" | undefined;

export interface IIssueActivityStoreActions {
  // actions
  fetchActivities: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    loaderType?: TActivityLoader
  ) => Promise<TIssueActivity[]>;
}

export interface IIssueActivityStore extends IIssueActivityStoreActions {
  // observables
  sortOrder: 'asc' | 'desc'
  loader: TActivityLoader;
  activities: TIssueActivityIdMap;
  activityMap: TIssueActivityMap;
  // helper methods
  getActivitiesByIssueId: (issueId: string) => string[] | undefined;
  getActivityById: (activityId: string) => TIssueActivity | undefined;
  getActivityCommentByIssueId: (issueId: string) => TIssueActivityComment[] | undefined;
  toggleSortOrder: ()=>void;
}

export class IssueActivityStore implements IIssueActivityStore {
  // observables
  sortOrder: "asc" | "desc" = 'asc';
  loader: TActivityLoader = "fetch";
  activities: TIssueActivityIdMap = {};
  activityMap: TIssueActivityMap = {};

  // services
  issueActivityService;

  constructor(protected store: CoreRootStore) {
    makeObservable(this, {
      // observables
      sortOrder: observable.ref,
      loader: observable.ref,
      activities: observable,
      activityMap: observable,
      // actions
      fetchActivities: action,
      toggleSortOrder: action
    });
    // services
    this.issueActivityService = new IssueActivityService();
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

  getActivityCommentByIssueId = computedFn((issueId: string) => {
    if (!issueId) return undefined;

    let activityComments: TIssueActivityComment[] = [];

    const activities = this.getActivitiesByIssueId(issueId) || [];
    const comments = this.store.issue.issueDetail.comment.getCommentsByIssueId(issueId) || [];

    activities.forEach((activityId) => {
      const activity = this.getActivityById(activityId);
      if (!activity) return;
      activityComments.push({
        id: activity.id,
        activity_type: EActivityFilterType.ACTIVITY,
        created_at: activity.created_at,
      });
    });

    comments.forEach((commentId) => {
      const comment = this.store.issue.issueDetail.comment.getCommentById(commentId);
      if (!comment) return;
      activityComments.push({
        id: comment.id,
        activity_type: EActivityFilterType.COMMENT,
        created_at: comment.created_at,
      });
    });

    activityComments = orderBy(activityComments, (e)=>new Date(e.created_at || 0), this.sortOrder);

    return activityComments;
  });

  toggleSortOrder = ()=>{
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
  }

  // actions
  public async fetchActivities(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    loaderType: TActivityLoader = "fetch"
  ) {
    try {
      this.loader = loaderType;

      let props = {};
      const currentActivityIds = this.getActivitiesByIssueId(issueId);
      if (currentActivityIds && currentActivityIds.length > 0) {
        const currentActivity = this.getActivityById(currentActivityIds[currentActivityIds.length - 1]);
        if (currentActivity) props = { created_at__gt: currentActivity.created_at };
      }

      const activities = await this.issueActivityService.getIssueActivities(workspaceSlug, projectId, issueId, props);

      const activityIds = activities.map((activity) => activity.id);

      runInAction(() => {
        update(this.activities, issueId, (currentActivityIds) => {
          if (!currentActivityIds) return activityIds;
          return uniq(concat(currentActivityIds, activityIds));
        });
        activities.forEach((activity) => {
          set(this.activityMap, activity.id, activity);
        });
        this.loader = undefined;
      });

      return activities;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  }
}

import concat from "lodash/concat";
import set from "lodash/set";
import sortBy from "lodash/sortBy";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, makeObservable, observable, runInAction } from "mobx";
import { TIssueActivityComment, TIssueActivity, TIssueActivityMap, TIssueActivityIdMap } from "@plane/types";
// services
import { IssueActivityService } from "@/services/issue";
// types
import { IIssueDetail } from "./root.store";

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
  loader: TActivityLoader;
  activities: TIssueActivityIdMap;
  activityMap: TIssueActivityMap;
  // helper methods
  getActivitiesByIssueId: (issueId: string) => string[] | undefined;
  getActivityById: (activityId: string) => TIssueActivity | undefined;
  getActivityCommentByIssueId: (issueId: string) => TIssueActivityComment[] | undefined;
}

export class IssueActivityStore implements IIssueActivityStore {
  // observables
  loader: TActivityLoader = "fetch";
  activities: TIssueActivityIdMap = {};
  activityMap: TIssueActivityMap = {};
  // root store
  rootIssueDetailStore: IIssueDetail;
  // services
  issueActivityService;

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      activities: observable,
      activityMap: observable,
      // actions
      fetchActivities: action,
    });
    // root store
    this.rootIssueDetailStore = rootStore;
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

  getActivityCommentByIssueId = (issueId: string) => {
    if (!issueId) return undefined;

    let activityComments: TIssueActivityComment[] = [];

    const activities = this.getActivitiesByIssueId(issueId) || [];
    const comments = this.rootIssueDetailStore.comment.getCommentsByIssueId(issueId) || [];

    activities.forEach((activityId) => {
      const activity = this.getActivityById(activityId);
      if (!activity) return;
      activityComments.push({
        id: activity.id,
        activity_type: "ACTIVITY",
        created_at: activity.created_at,
      });
    });

    comments.forEach((commentId) => {
      const comment = this.rootIssueDetailStore.comment.getCommentById(commentId);
      if (!comment) return;
      activityComments.push({
        id: comment.id,
        activity_type: "COMMENT",
        created_at: comment.created_at,
      });
    });

    activityComments = sortBy(activityComments, "created_at");
    activityComments = activityComments.map((activityComment) => ({
      id: activityComment.id,
      activity_type: activityComment.activity_type,
    }));

    return activityComments;
  };

  // actions
  fetchActivities = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    loaderType: TActivityLoader = "fetch"
  ) => {
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
      throw error;
    }
  };
}

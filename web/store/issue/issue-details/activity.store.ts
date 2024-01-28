import { action, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
import sortBy from "lodash/sortBy";
import update from "lodash/update";
import concat from "lodash/concat";
import uniq from "lodash/uniq";
// services
import { IssueActivityService } from "services/issue";
// types
import { IIssueDetail } from "./root.store";
import { TIssueActivityComment, TIssueActivity, TIssueActivityMap, TIssueActivityIdMap } from "@plane/types";

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
      const _activityIds = this.getActivitiesByIssueId(issueId);
      if (_activityIds && _activityIds.length > 0) {
        const _activity = this.getActivityById(_activityIds[_activityIds.length - 1]);
        if (_activity) props = { created_at__gt: _activity.created_at };
      }

      const activities = await this.issueActivityService.getIssueActivities(workspaceSlug, projectId, issueId, props);

      const activityIds = activities.map((activity) => activity.id);

      runInAction(() => {
        update(this.activities, issueId, (_activityIds) => {
          if (!_activityIds) return activityIds;
          return uniq(concat(_activityIds, activityIds));
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

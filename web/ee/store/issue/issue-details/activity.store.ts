/* eslint-disable no-useless-catch */

import sortBy from "lodash/sortBy";

import { makeObservable } from "mobx";
import { computedFn } from "mobx-utils";
import { TIssueActivity, TIssueActivityComment } from "@plane/types";
// plane web constants
import { EActivityFilterType, EActivityFilterTypeEE } from "@/plane-web/constants/issues";
// plane web store types
import { RootStore } from "@/plane-web/store/root.store";
// services
import { IssueActivityService } from "@/services/issue";
// ce store
import {
  IIssueActivityStoreActions as IIssueActivityStoreActionsCe,
  IIssueActivityStore as IIssueActivityStoreCe,
  IssueActivityStore as IssueActivityStoreCe,
} from "ce/store/issue/issue-details/activity.store";

export type TActivityLoader = "fetch" | "mutate" | undefined;

export interface IIssueActivityStoreActions extends IIssueActivityStoreActionsCe {}

export interface IIssueActivityStore extends IIssueActivityStoreCe {}

export class IssueActivityStore extends IssueActivityStoreCe implements IIssueActivityStore {
  // services
  issueActivityService;

  constructor(protected store: RootStore) {
    super(store);
    makeObservable(this, {
      // actions
    });
    // services
    this.issueActivityService = new IssueActivityService();
  }

  getActivityCommentByIssueId = computedFn((issueId: string) => {
    const workspace = this.store.workspaceRoot.currentWorkspace;
    if (!workspace?.id || !issueId) return undefined;

    let activityComments: TIssueActivityComment[] = [];

    const activities = this.getActivitiesByIssueId(issueId) || [];
    const comments = this.store.issue.issueDetail.comment.getCommentsByIssueId(issueId) || [];
    const worklogs = this.store.workspaceWorklogs.worklogIdsByIssueId(workspace?.id, issueId) || [];

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

    worklogs.forEach((worklogId) => {
      const worklog = this.store.workspaceWorklogs.worklogById(worklogId);
      if (!worklog || !worklog.id) return;
      activityComments.push({
        id: worklog.id,
        activity_type: EActivityFilterTypeEE.WORKLOG,
        created_at: worklog.created_at,
      });
    });

    activityComments = sortBy(activityComments, "created_at");

    return activityComments;
  });

  // actions
  fetchActivities = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    loaderType: TActivityLoader = "fetch"
  ) => {
    try {
      this.loader = loaderType;
      // fetching the worklogs for the issue
      const promiseResponse = await Promise.all([
        this.store.workspaceWorklogs.getWorklogsByIssueId(workspaceSlug, projectId, issueId),
        super.fetchActivities(workspaceSlug, projectId, issueId, loaderType),
      ]);
      return promiseResponse as unknown as TIssueActivity[];
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };
}

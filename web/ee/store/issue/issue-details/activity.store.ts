import sortBy from "lodash/sortBy";
import { makeObservable } from "mobx";
import { computedFn } from "mobx-utils";
import { TIssueActivityComment } from "@plane/types";
// ce store
import {
  IIssueActivityStoreActions as IIssueActivityStoreActionsCe,
  IIssueActivityStore as IIssueActivityStoreCe,
  IssueActivityStore as IssueActivityStoreCe,
} from "@/ce/store/issue/issue-details/activity.store";
// plane web constants
import { EActivityFilterType, EActivityFilterTypeEE } from "@/plane-web/constants/issues";
// plane web store types
import { RootStore } from "@/plane-web/store/root.store";
// services
import { IssueActivityService } from "@/services/issue";

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
    const additionalPropertiesActivities =
      this.store.issuePropertiesActivity.getPropertyActivityIdsByIssueId(issueId) || [];

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

    additionalPropertiesActivities.forEach((activityId) => {
      const activity = this.store.issuePropertiesActivity.getPropertyActivityById(activityId);
      if (!activity || !activity.id) return;
      activityComments.push({
        id: activity.id,
        activity_type: EActivityFilterTypeEE.ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY,
        created_at: activity.created_at,
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
      // check if worklogs are enabled for the project
      const isWorklogsEnabled = this.store.workspaceWorklogs.isWorklogsEnabledByProjectId(projectId);
      // check if issue types are enabled for the project
      const isIssueTypesDisplayEnabled = this.store.issueTypes.isIssueTypeEnabledForProject(
        workspaceSlug,
        projectId,
        "ISSUE_TYPE_DISPLAY"
      );
      await Promise.all([
        // fetching the worklogs for the issue if worklogs are enabled
        isIssueTypesDisplayEnabled &&
          this.store.issuePropertiesActivity.fetchPropertyActivities(workspaceSlug, projectId, issueId),
        // fetching the activities for issue custom properties if issue types are enabled
        isWorklogsEnabled && this.store.workspaceWorklogs.getWorklogsByIssueId(workspaceSlug, projectId, issueId),
      ]).catch((error) => {
        throw error;
      });
      // fetching the activities for the issue
      const activities = await super.fetchActivities(workspaceSlug, projectId, issueId, loaderType);
      return activities;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };
}

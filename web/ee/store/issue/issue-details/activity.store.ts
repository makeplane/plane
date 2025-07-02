import orderBy from "lodash/orderBy";
import { makeObservable } from "mobx";
import { computedFn } from "mobx-utils";
// plane package imports
import { E_SORT_ORDER, EActivityFilterType, EActivityFilterTypeEE } from "@plane/constants";
import { EIssueServiceType, TIssueActivityComment, TIssueServiceType } from "@plane/types";
// ce store
import {
  IIssueActivityStoreActions as IIssueActivityStoreActionsCe,
  IIssueActivityStore as IIssueActivityStoreCe,
  IssueActivityStore as IssueActivityStoreCe,
} from "@/ce/store/issue/issue-details/activity.store";
// plane web store types
import { RootStore } from "@/plane-web/store/root.store";
// services
import { IssueActivityService } from "@/services/issue";

export type TActivityLoader = "fetch" | "mutate" | undefined;

export type IIssueActivityStoreActions = IIssueActivityStoreActionsCe;

export type IIssueActivityStore = IIssueActivityStoreCe;

export class IssueActivityStore extends IssueActivityStoreCe implements IIssueActivityStore {
  // services
  issueActivityService;

  constructor(
    protected store: RootStore,
    serviceType: TIssueServiceType = EIssueServiceType.ISSUES
  ) {
    super(store);
    makeObservable(this, {
      // actions
    });
    // services
    this.serviceType = serviceType;
    this.issueActivityService = new IssueActivityService(this.serviceType);
  }

  getActivityCommentByIssueId = computedFn((issueId: string, sortOrder: E_SORT_ORDER) => {
    const workspace = this.store.workspaceRoot.currentWorkspace;
    if (!workspace?.id || !issueId) return undefined;

    const currentStore =
      this.serviceType === EIssueServiceType.EPICS ? this.store.issue.epicDetail : this.store.issue.issueDetail;

    let activityComments: TIssueActivityComment[] = [];

    const activities = this.getActivitiesByIssueId(issueId) || [];
    const comments = currentStore.comment.getCommentsByIssueId(issueId) || [];
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
      const comment = currentStore.comment.getCommentById(commentId);
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

    activityComments = orderBy(activityComments, (e) => new Date(e.created_at || 0), sortOrder);

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
      // check if work item types are enabled for the project
      const isWorkItemTypeEnabled = this.store.issueTypes.isWorkItemTypeEnabledForProject(workspaceSlug, projectId);
      await Promise.all([
        // fetching the worklogs for the issue if worklogs are enabled
        isWorkItemTypeEnabled &&
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

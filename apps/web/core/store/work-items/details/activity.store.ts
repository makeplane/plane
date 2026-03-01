/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { concat, orderBy, set, uniq, update } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane package imports
import type { E_SORT_ORDER } from "@plane/constants";
import { EActivityFilterType } from "@plane/constants";
import type {
  TIssueActivityComment,
  TIssueActivity,
  TIssueActivityMap,
  TIssueActivityIdMap,
  TIssueServiceType,
  IIssuePropertiesActivityStore,
} from "@plane/types";
import { EIssueServiceType, EWorkItemTypeEntity } from "@plane/types";
// plane web constants
// services
import { IssueActivityService } from "@/services/issue";
// store
import type { CoreRootStore } from "@/store/root.store";
import { IssuePropertiesActivityStore } from "@/store/issue-types/issue-properties-activity.store";
import type { RootStore } from "@/plane-web/store/root.store";

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
  issuePropertiesActivity: IIssuePropertiesActivityStore;
  // helper methods
  getActivitiesByIssueId: (issueId: string) => string[] | undefined;
  getActivityById: (activityId: string) => TIssueActivity | undefined;
  getActivityAndCommentsByIssueId: (issueId: string, sortOrder: E_SORT_ORDER) => TIssueActivityComment[] | undefined;
}

export class IssueActivityStore implements IIssueActivityStore {
  // observables
  loader: TActivityLoader = "fetch";
  activities: TIssueActivityIdMap = {};
  activityMap: TIssueActivityMap = {};
  issuePropertiesActivity: IssuePropertiesActivityStore;
  // services
  serviceType;
  issueActivityService;

  constructor(
    protected store: CoreRootStore,
    serviceType: TIssueServiceType = EIssueServiceType.ISSUES
  ) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      activities: observable,
      activityMap: observable,
      // actions
      fetchActivities: action,
    });
    this.serviceType = serviceType;
    // services
    this.issueActivityService = new IssueActivityService(this.serviceType);
    this.issuePropertiesActivity = new IssuePropertiesActivityStore(this.store as unknown as RootStore);
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

  protected buildActivityAndCommentItems(issueId: string): TIssueActivityComment[] | undefined {
    if (!issueId) return undefined;

    const activityComments: TIssueActivityComment[] = [];

    const currentStore =
      this.serviceType === EIssueServiceType.EPICS ? this.store.issue.epicDetail : this.store.issue.issueDetail;

    const activities = this.getActivitiesByIssueId(issueId);
    const comments = currentStore.comment.getCommentsByIssueId(issueId);

    if (!activities || !comments) return undefined;

    activities.forEach((activityId) => {
      const activity = this.getActivityById(activityId);
      if (!activity) return;
      const type =
        activity.field === "state"
          ? EActivityFilterType.STATE
          : activity.field === "assignees"
            ? EActivityFilterType.ASSIGNEE
            : activity.field === null
              ? EActivityFilterType.DEFAULT
              : EActivityFilterType.ACTIVITY;
      activityComments.push({
        id: activity.id,
        activity_type: type,
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

    return activityComments;
  }

  protected sortActivityComments(items: TIssueActivityComment[], sortOrder: E_SORT_ORDER): TIssueActivityComment[] {
    return orderBy(items, (e) => new Date(e.created_at || 0), sortOrder);
  }

  getActivityAndCommentsByIssueId = computedFn((issueId: string, sortOrder: E_SORT_ORDER) => {
    const workspace = this.store.workspaceRoot.currentWorkspace;
    if (!workspace?.id || !issueId) return undefined;

    const worklogs = this.store.workspaceWorklogs.worklogIdsByIssueId(workspace?.id, issueId);
    const additionalPropertiesActivities = this.issuePropertiesActivity.getPropertyActivityIdsByIssueId(issueId);

    const baseItems = this.buildActivityAndCommentItems(issueId);
    if (!baseItems || !worklogs || !additionalPropertiesActivities) return undefined;

    const activityComments: TIssueActivityComment[] = [...baseItems];

    worklogs.forEach((worklogId) => {
      const worklog = this.store.workspaceWorklogs.worklogById(worklogId);
      if (!worklog || !worklog.id) return;
      activityComments.push({
        id: worklog.id,
        activity_type: EActivityFilterType.WORKLOG,
        created_at: worklog.created_at,
      });
    });

    additionalPropertiesActivities.forEach((activityId) => {
      const activity = this.issuePropertiesActivity.getPropertyActivityById(activityId);
      if (!activity || !activity.id) return;
      activityComments.push({
        id: activity.id,
        activity_type: EActivityFilterType.ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY,
        created_at: activity.created_at,
      });
    });

    return this.sortActivityComments(activityComments, sortOrder);
  });

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
      const isWorkItemTypeEnabled = this.store.issueTypes.isWorkItemTypeEntityEnabledForProject(
        workspaceSlug,
        projectId,
        this.serviceType === EIssueServiceType.EPICS ? EWorkItemTypeEntity.EPIC : EWorkItemTypeEntity.WORK_ITEM
      );

      await Promise.all([
        // fetching the worklogs for the issue if worklogs are enabled
        isWorkItemTypeEnabled &&
          this.issuePropertiesActivity.fetchPropertyActivities(
            workspaceSlug,
            projectId,
            issueId,
            "init-loader",
            this.serviceType
          ),
        // fetching the activities for issue custom properties if issue types are enabled
        isWorklogsEnabled && this.store.workspaceWorklogs.getWorklogsByIssueId(workspaceSlug, projectId, issueId),
      ]).catch((error) => {
        throw error;
      });
      // fetching the activities for the issue
      const activities = await this.fetchBaseActivities(workspaceSlug, projectId, issueId, loaderType);
      return activities;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  // private helper methods
  private async fetchBaseActivities(
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

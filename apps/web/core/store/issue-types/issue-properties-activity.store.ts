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

import { orderBy, isEmpty, set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import type {
  TLoader,
  TIssuePropertiesActivity,
  IIssuePropertiesActivity,
  IIssuePropertiesActivityStore,
  TIssueServiceType,
} from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// helpers
import { convertToEpoch } from "@plane/utils";
// plane web services
import { IssuePropertiesActivityService } from "@/services/issue-types";
// plane web store
import { IssuePropertiesActivity } from "@/store/issue-types";
import type { RootStore } from "@/plane-web/store/root.store";

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
    if (!issueId || !this.propertyActivities) return undefined;
    if (isEmpty(this.propertyActivities)) return [];
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
        set(this.propertyActivities, activity.id, new IssuePropertiesActivity(activity));
      }
    }
  };

  // actions
  fetchPropertyActivities = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    loaderType: TLoader = "init-loader",
    serviceType: TIssueServiceType = EIssueServiceType.ISSUES
  ) => {
    try {
      this.loader = loaderType ?? "init-loader";
      // get last activity created_at timestamp
      let params = {};
      const currentActivityIds = this.getPropertyActivityIdsByIssueId(issueId);
      if (currentActivityIds && currentActivityIds.length > 0) {
        const currentActivity = this.getPropertyActivityById(currentActivityIds[0]); // getPropertyActivityIdsByIssueId returns sorted activities by created_at
        if (currentActivity) params = { created_at__gt: currentActivity.created_at };
      }

      // fetch property activities after last activity created_at timestamp
      const issuePropertiesActivities = await this.service.fetchAll(
        workspaceSlug,
        projectId,
        issueId,
        params,
        serviceType
      );
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

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

import type { TIssueServiceType, TLoader } from "../issues/base";
import type { IUserLite } from "../users";

export type TIssuePropertyAction = "created" | "updated" | "deleted";

export type TIssuePropertiesActivity = {
  id: string | undefined;
  old_value: string | undefined;
  new_value: string | undefined;
  old_identifier: string | undefined;
  new_identifier: string | undefined;

  action: TIssuePropertyAction | undefined;
  epoch: number | undefined;
  comment: string | undefined;
  actor_detail: IUserLite | undefined;

  issue: string | undefined;
  property: string | undefined;
  actor: string | undefined;
  project: string | undefined;
  workspace: string | undefined;

  created_at: string | undefined;
  created_by: string | undefined;
  updated_at: string | undefined;
  updated_by: string | undefined;
};

// Issue properties activity instance
export interface IIssuePropertiesActivity extends TIssuePropertiesActivity {
  // computed
  asJSON: TIssuePropertiesActivity;
  // helper action
  updateActivityData: (issueActivityData: Partial<TIssuePropertiesActivity>) => void;
}

// Issue properties activity store
export interface IIssuePropertiesActivityStore {
  // observables
  loader: TLoader;
  propertyActivities: Record<string, IIssuePropertiesActivity>; // activityId -> IIssuePropertiesActivity

  // computed functions
  getPropertyActivityIdsByIssueId: (issueId: string) => string[] | undefined;
  getPropertyActivityById: (activityId: string) => IIssuePropertiesActivity | undefined;
  // helper actions
  addOrUpdatePropertyActivity: (activities: TIssuePropertiesActivity[]) => void;
  // actions
  fetchPropertyActivities: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    loaderType?: TLoader,
    serviceType?: TIssueServiceType
  ) => Promise<TIssuePropertiesActivity[]>;
}

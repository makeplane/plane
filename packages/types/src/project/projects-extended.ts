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

import type { EUpdateStatus } from "../enums";

export enum EProjectPriority {
  NONE = "none",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum EProjectStateGroup {
  DRAFT = "draft",
  PLANNING = "planning",
  EXECUTION = "execution",
  MONITORING = "monitoring",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum EProjectAccess {
  PUBLIC = "public",
  PRIVATE = "private",
}

export enum EProjectStateLoader {
  INIT_LOADER = "project-state-init-loader",
  MUTATION_LOADER = "project-state-mutation-loader",
}

export type TProjectPriority = EProjectPriority;

export type TProjectStateLoader = EProjectStateLoader | undefined;

export type TProjectStateDraggableData = {
  groupKey: TProjectStateGroupKey;
  id: string;
};

export type TProjectStateGroupKey = EProjectStateGroup;

export type TProjectState = {
  id: string | undefined;
  name: string | undefined;
  description: string | undefined;
  color: string | undefined;
  sequence: number | undefined;
  group: TProjectStateGroupKey | undefined;
  default: boolean | undefined;
  external_source: string | undefined;
  external_id: string | undefined;
  workspace_id: string | undefined;
  created_by: string | undefined;
  updated_by: string | undefined;
  created_at: string | undefined;
  updated_at: string | undefined;
};

export type TProjectStateIdsByGroup = {
  [key in TProjectStateGroupKey]: string[];
};

export type TProjectStatesByGroup = {
  [key in TProjectStateGroupKey]: TProjectState[];
};

export type TProjectAttributes = {
  state_id?: string | undefined;
  priority?: TProjectPriority | undefined;
  start_date?: string | undefined | null;
  target_date?: string | undefined | null;
};

export type TProjectAttributesParams = {
  project_ids?: string;
};

export type TProjectAttributesResponse = TProjectAttributes & {
  project_id: string;
};

export type TProjectExtended = TProjectAttributes & {
  description_html?: string | null | undefined;
  project_name?: string;
  update_status?: EUpdateStatus | undefined;
  initiative_ids?: string[];
  label_ids?: string[];
};

export type TProjectFeaturesList = {
  is_project_updates_enabled: boolean;
  is_epic_enabled: boolean;
  is_issue_type_enabled: boolean;
  is_time_tracking_enabled: boolean;
  is_workflow_enabled: boolean;
  is_milestone_enabled: boolean;
  is_automated_cycle_enabled: boolean;
};

export type TProjectFeatures = {
  id?: string | undefined;
  project_id: string;
} & TProjectFeaturesList;

export type TProjectIssuesSearchParamsExtended = {
  milestone_id?: string;
  customer_request_id?: string;
  convert?: boolean;
};

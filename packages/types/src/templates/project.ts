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

import type { TInboxForm } from "../intake";
import type { IIssueLabel } from "../issues";
import type { TModuleStatus } from "../module";
import type { TProject, TProjectPriority, TProjectState } from "../project";
import type { IState } from "../state";
import type { IUserLite } from "../users";
import type { CompleteOrEmpty } from "../utils";
import type { IIssueType, TIssueType } from "../work-item-types-legacy";
import type { ETemplateType, TBaseTemplate } from "./base";
import type {
  TCustomPropertyBlueprint,
  TWorkItemBlueprint,
  TWorkItemBlueprintFormData,
  TWorkItemLabelBlueprint,
  TWorkItemTypeBlueprint,
} from "./blueprint/work-item";

export type TProjectStateBlueprint = Pick<TProjectState, "id" | "name" | "description" | "color" | "group" | "default">;

export type TProjectMemberBlueprint = Pick<IUserLite, "id">;

export type TProjectWorkItemStateBlueprint = Pick<
  IState,
  "id" | "name" | "description" | "color" | "group" | "default" | "sequence"
>;

export type TProjectWorkflowBlueprint = object;

export type TProjectEstimateBlueprint = object;

export type TProjectWorkItemTypeBlueprint = TWorkItemTypeBlueprint &
  Pick<TIssueType, "is_default" | "is_active"> & {
    properties: TCustomPropertyBlueprint[];
  };

export type TProjectEpicBlueprint = TProjectWorkItemTypeBlueprint;

export type TIntakeSettingsBlueprint = Pick<TInboxForm, "is_in_app_enabled" | "is_form_enabled"> & {
  is_email_enabled: boolean; // TODO: Remove this once the property is added to the inbox form
};

export type TProjectModuleBlueprint = {
  id: string;
  name: string;
  description?: string;
  status: TModuleStatus;
  lead_id?: string | null;
  member_ids?: string[];
};

export type TProjectTemplateData = Pick<
  TProject,
  // basics
  | "name"
  | "description"
  | "network"
  | "logo_props"
  // feature toggles
  | "cycle_view"
  | "module_view"
  | "issue_views_view"
  | "page_view"
  | "guest_view_all_features"
  // timezone
  | "timezone"
  // automation
  | "archive_in"
  | "close_in"
> & {
  cover_asset?: string;
  // feature toggles
  intake_view: boolean;
  intake_settings: TIntakeSettingsBlueprint;
  is_time_tracking_enabled: boolean;
  is_issue_type_enabled: boolean;
  is_project_updates_enabled: boolean;
  is_epic_enabled: boolean;
  is_workflow_enabled: boolean;
  is_milestone_enabled: boolean;
  // project grouping
  priority?: TProjectPriority;
  project_state: CompleteOrEmpty<TProjectStateBlueprint>;
  start_date?: string;
  target_date?: string;
  // attributes
  project_lead: CompleteOrEmpty<TProjectMemberBlueprint>;
  default_assignee: CompleteOrEmpty<TProjectMemberBlueprint>;
  members: TProjectMemberBlueprint[];
  archived_at?: string;
  states: CompleteOrEmpty<TProjectWorkItemStateBlueprint>[];
  labels: CompleteOrEmpty<TWorkItemLabelBlueprint>[];
  modules: TProjectModuleBlueprint[];
  workflows: CompleteOrEmpty<TProjectWorkflowBlueprint>[];
  estimates: CompleteOrEmpty<TProjectEstimateBlueprint>[];
  workitem_types: CompleteOrEmpty<TProjectWorkItemTypeBlueprint>[];
  epics: CompleteOrEmpty<TProjectEpicBlueprint>;
  // work items
  workitems: TWorkItemBlueprint[];
  // workspace
  workspace: string;
};

export type TProjectTemplate = TBaseTemplate<ETemplateType.PROJECT, TProjectTemplateData>;

export type TProjectTemplateFormData = Pick<
  TProjectTemplateData,
  // basics
  | "name"
  | "description"
  | "logo_props"
  | "network"
  // project grouping
  | "priority"
  | "start_date"
  | "target_date"
  // feature toggles
  | "cycle_view"
  | "module_view"
  | "issue_views_view"
  | "page_view"
  | "intake_view"
  | "is_time_tracking_enabled"
  | "is_issue_type_enabled"
  | "is_project_updates_enabled"
  | "is_epic_enabled"
  | "is_workflow_enabled"
  | "is_milestone_enabled"
> &
  Pick<
    TProject,
    // attributes
    "cover_image_url" | "state_id" | "project_lead" | "members"
  > & {
    id: string;
    labels: IIssueLabel[];
    modules: TProjectModuleBlueprint[];
    states: IState[];
    workitem_types: Record<string, IIssueType>;
    epics: IIssueType | undefined;
    intake_settings: TIntakeSettingsBlueprint;
    workitems: TWorkItemBlueprintFormData[];
  };

export type TProjectTemplateForm = {
  template: Pick<TProjectTemplate, "id" | "name" | "short_description">;
  project: TProjectTemplateFormData;
};

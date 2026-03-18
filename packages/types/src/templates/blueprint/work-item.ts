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

// local imports
import type { IIssueLabel } from "../../issues";
import type { TIssue } from "../../issues/issue";
import type { IModule } from "../../module";
import type { IState } from "../../state";
import type { IUserLite } from "../../users";
import type { CompleteOrEmpty } from "../../utils";
import type { TIssuePropertyOption, TIssueType } from "../../work-item-types-legacy";
import type { EIssuePropertyType, TIssueProperty } from "../../work-item-types-legacy/work-item-properties";

export type TWorkItemTypeBlueprint = Pick<TIssueType, "id" | "name" | "description" | "logo_props" | "is_epic">;

export type TWorkItemStateBlueprint = Pick<Partial<IState>, "id" | "name" | "group">;

type TWorkItemAssigneeBlueprint = Pick<IUserLite, "id">;

export type TWorkItemLabelBlueprint = Pick<IIssueLabel, "id" | "name" | "color">;

type TWorkItemModuleBlueprint = Pick<IModule, "id" | "name">;

type TCustomPropertyOptionBlueprint = Pick<
  TIssuePropertyOption,
  "id" | "name" | "is_active" | "is_default" | "logo_props"
>;

export type TCustomPropertyBlueprint = Pick<
  TIssueProperty<EIssuePropertyType>,
  | "id"
  | "name"
  | "issue_type"
  | "display_name"
  | "description"
  | "property_type"
  | "relation_type"
  | "logo_props"
  | "is_required"
  | "settings"
  | "is_active"
  | "is_multi"
  | "default_value"
> & {
  options: TCustomPropertyOptionBlueprint[];
};

export type TCustomPropertyWithValuesBlueprint = TCustomPropertyBlueprint & {
  values: string[];
};

export type TWorkItemPropertyBlueprint = TCustomPropertyWithValuesBlueprint & { type: TWorkItemTypeBlueprint };

export type TWorkItemBlueprint = Pick<TIssue, "name" | "description_html" | "priority"> & {
  id?: string;
  state: CompleteOrEmpty<TWorkItemStateBlueprint>;
  assignees: TWorkItemAssigneeBlueprint[];
  labels: TWorkItemLabelBlueprint[];
  type: CompleteOrEmpty<TWorkItemTypeBlueprint>;
  modules: TWorkItemModuleBlueprint[];
  properties: TWorkItemPropertyBlueprint[];
  workspace: string;
  project: string | null;
};

export type TWorkItemBlueprintFormData = Pick<
  TIssue,
  | "id"
  | "project_id"
  | "type_id"
  | "name"
  | "description_html"
  | "state_id"
  | "priority"
  | "assignee_ids"
  | "label_ids"
  | "module_ids"
>;

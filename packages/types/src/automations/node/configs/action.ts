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

export type TAddCommentActionConfig = {
  comment_text: string;
};

export enum EAutomationChangePropertyType {
  STATE = "state_id",
  PRIORITY = "priority",
  ASSIGNEE = "assignee_ids",
  LABELS = "label_ids",
  START_DATE = "start_date",
  DUE_DATE = "target_date",
}

export enum EAutomationChangeType {
  ADD = "add",
  REMOVE = "remove",
  UPDATE = "update",
}

export type TChangePropertyActionConfig = {
  change_type: EAutomationChangeType;
  property_name: EAutomationChangePropertyType;
  property_value: string[];
};

export type TRunScriptActionConfig = {
  script_id: string;
  execution_variables?: Record<string, string>;
};

export type TChangePropertyActionFormConfig = {
  change_type?: EAutomationChangeType;
  property_name?: EAutomationChangePropertyType;
  property_value: string[];
};

export type TAutomationActionNodeConfig =
  | TAddCommentActionConfig
  | TChangePropertyActionConfig
  | TRunScriptActionConfig;

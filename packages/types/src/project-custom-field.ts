/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TProjectCustomFieldType = "number" | "text" | "date" | "dropdown" | "member";

export interface IProjectCustomField {
  id: string;
  name: string;
  description: string;
  field_type: TProjectCustomFieldType;
  sort_order: number;
  is_active: boolean;
  // Display grouping hint for the project-info page (e.g. "项目&合同基本信息");
  // null for ad-hoc fields not created from the default set, which render ungrouped.
  group_name: string | null;
  // True only for default-seeded fields the backend enforces as workspace-unique
  // (currently just "合同号&项目号"). Read-only: never settable from this app.
  is_unique_key: boolean;
  project_id: string;
  workspace_id: string;
}

export interface IProjectCustomFieldOption {
  id: string;
  custom_field: string;
  name: string;
  sort_order: number;
  project_id: string;
  workspace_id: string;
}

export interface IProjectCustomFieldValue {
  id: string;
  custom_field: string;
  field_name: string;
  field_type: TProjectCustomFieldType;
  // DRF DecimalField serializes as a string to avoid float precision loss in JSON.
  value_decimal: string | null;
  value_text: string | null;
  // ISO date string (YYYY-MM-DD), DRF DateField's default JSON representation.
  value_date: string | null;
  value_option: string | null;
  value_member: string | null;
  project_id: string;
  workspace_id: string;
}

// A write payload carries exactly one of the value_* columns, matching the field's
// type; the backend rejects any other combination. Modeled as a union of single-key
// shapes (rather than Partial<IProjectCustomFieldValue>) so passing two columns at
// once, or a column the field type doesn't use, is a compile-time error at call sites
// that build the payload as an object literal.
export type TProjectCustomFieldValuePayload =
  | { value_decimal: IProjectCustomFieldValue["value_decimal"] }
  | { value_text: IProjectCustomFieldValue["value_text"] }
  | { value_date: IProjectCustomFieldValue["value_date"] }
  | { value_option: IProjectCustomFieldValue["value_option"] }
  | { value_member: IProjectCustomFieldValue["value_member"] };

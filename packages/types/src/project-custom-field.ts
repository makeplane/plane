/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TProjectCustomFieldType = "number";

export interface IProjectCustomField {
  id: string;
  name: string;
  description: string;
  field_type: TProjectCustomFieldType;
  sort_order: number;
  is_active: boolean;
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
  project_id: string;
  workspace_id: string;
}

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export enum ECustomFieldEntityType {
  PROJECT = "project",
  WORK_ITEM = "work_item",
}

export enum ECustomFieldType {
  TEXT = "text",
  PARAGRAPH = "paragraph",
  NUMBER = "number",
  SINGLE_SELECT = "single_select",
  MULTI_SELECT = "multi_select",
  BOOLEAN = "boolean",
  RADIO = "radio",
  DATE = "date",
  DATETIME = "datetime",
  COLOR = "color",
  URL = "url",
  EMAIL = "email",
}

export type TCustomFieldOption = {
  id: string;
  label: string;
  color?: string;
};

/** Type-specific configuration stored in `settings` (shape depends on field_type). */
export type TCustomFieldSettings = {
  placeholder?: string;
  min?: number | string;
  max?: number | string;
  step?: number;
  min_length?: number;
  max_length?: number;
  options?: TCustomFieldOption[];
  label?: string;
};

/** Hyperlink field value: the URL plus an optional display label. */
export type TCustomFieldUrlValue = { url: string; text?: string };

/** Concrete value of any custom field (the union depends on field_type). */
export type TCustomFieldRawValue = string | number | boolean | string[] | TCustomFieldUrlValue | null;

export type TCustomField = {
  id: string;
  workspace: string;
  entity_type: ECustomFieldEntityType;
  display_name: string;
  key: string;
  description: string;
  field_type: ECustomFieldType;
  settings: TCustomFieldSettings;
  default_value: TCustomFieldRawValue;
  is_required: boolean;
  admin_only: boolean;
  is_active: boolean;
  sort_order: number;
  width: number;
  created_at?: string;
  updated_at?: string;
};

/** A field definition joined with its stored value for a given entity. */
export type TCustomFieldWithValue = TCustomField & {
  value: TCustomFieldRawValue;
};

export type TCustomFieldValuePayload = {
  custom_field: string;
  value: TCustomFieldRawValue;
};

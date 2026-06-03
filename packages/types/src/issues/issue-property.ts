/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export enum EIssuePropertyType {
  TEXT = "TEXT",
  DECIMAL = "DECIMAL",
  BOOLEAN = "BOOLEAN",
  DATETIME = "DATETIME",
  OPTION = "OPTION",
  RELATION = "RELATION",
  URL = "URL",
}

export enum EIssuePropertyRelationType {
  ISSUE = "ISSUE",
  USER = "USER",
}

export type TWorkItemType = {
  id: string;
  name: string;
  description: string;
  logo_props: Record<string, unknown>;
  is_epic: boolean;
  is_default: boolean;
  is_active: boolean;
  level: number;
  workspace?: string;
  external_source?: string | null;
  external_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TIssuePropertyOption = {
  id: string;
  name: string;
  description?: string;
  logo_props?: Record<string, unknown>;
  sort_order?: number;
  is_active: boolean;
  is_default: boolean;
  parent?: string | null;
  property?: string;
  project_id?: string;
  workspace_id?: string;
  external_source?: string | null;
  external_id?: string | null;
};

export type TIssueProperty = {
  id: string;
  name: string;
  display_name: string;
  description: string;
  logo_props?: Record<string, unknown>;
  sort_order?: number;
  property_type: EIssuePropertyType;
  relation_type?: EIssuePropertyRelationType | null;
  is_required: boolean;
  default_value: string[];
  settings: Record<string, unknown>;
  is_active: boolean;
  is_multi: boolean;
  validation_rules: Record<string, unknown>;
  issue_type?: string;
  project_id?: string;
  workspace_id?: string;
  options: TIssuePropertyOption[];
  external_source?: string | null;
  external_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TIssuePropertyValueRecord = {
  id: string;
  issue: string;
  property: string;
  value_text?: string | null;
  value_boolean?: boolean;
  value_decimal?: number;
  value_datetime?: string | null;
  value_uuid?: string | null;
  value_option?: string | null;
};

/** A create/update payload of property values keyed by property id. */
export type TIssuePropertyValuesPayload = Record<string, string[]>;

/** A read response of property values keyed by property id. */
export type TIssuePropertyValuesResponse = Record<string, TIssuePropertyValueRecord[]>;

export type TWorkItemTypeCreatePayload = Partial<TWorkItemType>;

export type TIssuePropertyCreatePayload = Omit<Partial<TIssueProperty>, "options"> & {
  options?: Partial<TIssuePropertyOption>[];
};

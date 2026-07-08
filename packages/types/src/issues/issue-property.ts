/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TLogoProps } from "../common";

/**
 * Data type of a custom property. Mirrors the backend ``PropertyTypeEnum``.
 * V1 exposes TEXT, DECIMAL, BOOLEAN, DATETIME, OPTION, RELATION and URL.
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

/**
 * Target of a RELATION property. Mirrors the backend ``RelationTypeEnum``.
 */
export enum EIssuePropertyRelationType {
  USER = "USER",
  ISSUE = "ISSUE",
}

export type TIssuePropertyType = `${EIssuePropertyType}`;
export type TIssuePropertyRelationType = `${EIssuePropertyRelationType}`;

/**
 * A selectable option of an OPTION property.
 */
export interface IIssuePropertyOption {
  id: string;
  property_id: string;
  project_id: string;
  workspace_id: string;
  name: string;
  description: string;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  logo_props?: TLogoProps;
  external_source?: string | null;
  external_id?: string | null;
}

/**
 * Definition of a custom property attached to a work item type.
 */
export interface IIssueProperty {
  id: string;
  issue_type_id: string;
  project_id: string;
  workspace_id: string;
  display_name: string;
  description: string;
  property_type: EIssuePropertyType;
  relation_type: EIssuePropertyRelationType | null;
  is_required: boolean;
  is_multi: boolean;
  is_active: boolean;
  default_value: string | null;
  settings: Record<string, unknown>;
  sort_order: number;
  external_source?: string | null;
  external_id?: string | null;
  options: IIssuePropertyOption[];
}

/**
 * A typed value row of a custom property for a specific work item, as returned
 * by the backend value endpoints. Only the column matching the property type is
 * populated.
 */
export interface IIssuePropertyValue {
  id: string;
  issue_id: string;
  property_id: string;
  project_id: string;
  workspace_id: string;
  value_text: string | null;
  value_boolean: boolean | null;
  value_decimal: number | string | null;
  value_datetime: string | null;
  value_uuid: string | null;
  value_option: string | null;
  external_source?: string | null;
  external_id?: string | null;
}

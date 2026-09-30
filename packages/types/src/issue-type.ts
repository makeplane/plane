/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TLogoProps } from "./common";

export type TIssueTypePropertyType = "text" | "number" | "dropdown" | "boolean" | "date" | "member_picker";

export type TIssueTypeDropdownSelectMode = "single" | "multi";

export type TIssueTypeProperty = {
  id: string;
  title: string;
  description?: string;
  property_type: TIssueTypePropertyType;
  is_mandatory: boolean;
  is_active: boolean;
  sort_order?: number;
  options?: string[];
  select_mode?: TIssueTypeDropdownSelectMode;
  default_value?: string | number | boolean | string[] | null;
  created_at?: string;
  updated_at?: string;
};

export type TIssueType = {
  id: string;
  name: string;
  description: string;
  logo_props: TLogoProps;
  is_epic: boolean;
  is_default: boolean;
  is_active: boolean;
  level: number;
  properties: TIssueTypeProperty[];
  project_ids: string[];
  created_at: string;
  updated_at: string;
};

export type TProjectIssueType = {
  id: string;
  issue_type_id: string;
  issue_type_detail?: TIssueType;
  level: number;
  is_default: boolean;
};

export type TIssueTypePropertyValueEntry = {
  property_id: string;
  title?: string;
  property_type?: TIssueTypePropertyType;
  is_mandatory?: boolean;
  options?: string[];
  select_mode?: TIssueTypeDropdownSelectMode;
  default_value?: unknown;
  value?: unknown;
};

export type TIssuePropertyValuesMap = Record<string, unknown>;

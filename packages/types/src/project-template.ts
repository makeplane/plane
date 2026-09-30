/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TLogoProps } from "./common";

export type TProjectTemplateCustomPropertyType = "text" | "number" | "dropdown" | "boolean" | "date" | "member_picker";

export type TProjectTemplateDropdownSelectMode = "single" | "multi";

export type TProjectTemplateCustomProperty = {
  title: string;
  description?: string;
  is_mandatory: boolean;
  is_active: boolean;
  property_type: TProjectTemplateCustomPropertyType;
  options?: string[];
  select_mode?: TProjectTemplateDropdownSelectMode;
  default_option?: string | null;
};

export type TProjectTemplateAdditionalWorkItemType = {
  name: string;
  description?: string;
  custom_properties?: TProjectTemplateCustomProperty[];
};

export type TProjectTemplatePayload = {
  name?: string;
  identifier?: string;
  description?: string;
  start_date?: string | null;
  target_date?: string | null;
  network?: 0 | 2;
  project_lead?: string | null;
  default_assignee?: string | null;
  logo_props?: TLogoProps | null;
  cover_image_url?: string | null;
  cycle_view?: boolean;
  module_view?: boolean;
  issue_views_view?: boolean;
  page_view?: boolean;
  intake_view?: boolean;
  is_time_tracking_enabled?: boolean;
  is_issue_type_enabled?: boolean;
  guest_view_all_features?: boolean;
  epic_enabled?: boolean;
  state_templates?: {
    name: string;
    group?: "backlog" | "unstarted" | "started" | "completed" | "cancelled";
    color?: string | null;
    default?: boolean;
  }[];
  label_templates?: {
    name: string;
    color?: string | null;
  }[];
  task_custom_properties?: TProjectTemplateCustomProperty[];
  epic_custom_properties?: TProjectTemplateCustomProperty[];
  additional_work_item_types?: TProjectTemplateAdditionalWorkItemType[];
};

export type TProjectTemplate = {
  id: string;
  name: string;
  description: string;
  payload: TProjectTemplatePayload;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

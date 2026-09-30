/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TStateTemplateGroup = "backlog" | "unstarted" | "started" | "completed" | "cancelled";

export type TStateTemplateField = {
  id: string;
  name: string;
  group: TStateTemplateGroup;
  color: string;
  default: boolean;
};

export type TLabelTemplateField = {
  id: string;
  name: string;
  color: string;
};

export type TCustomPropertyType = "text" | "number" | "dropdown" | "boolean" | "date" | "member_picker";

export type TDropdownSelectMode = "single" | "multi";

export type TCustomPropertyTemplateField = {
  id: string;
  title: string;
  description: string;
  isMandatory: boolean;
  isActive: boolean;
  propertyType: TCustomPropertyType;
  options: string[];
  selectMode: TDropdownSelectMode;
  defaultOption: string | null;
};

export type TAdditionalWorkItemTypeTemplate = {
  id: string;
  name: string;
  description: string;
  customProperties: TCustomPropertyTemplateField[];
};

export type TProjectTemplateFeatureToggles = {
  cycle_view: boolean;
  module_view: boolean;
  issue_views_view: boolean;
  page_view: boolean;
  intake_view: boolean;
  is_time_tracking_enabled: boolean;
  is_issue_type_enabled: boolean;
};

export type TProjectTemplateFormFields = {
  templateName: string;
  templateNote: string;
  projectName: string;
  projectIdentifier: string;
  projectDescription: string;
  projectLeadId: string | null;
  defaultAssigneeId: string | null;
  coverImageUrl: string;
  startDate: string | null;
  targetDate: string | null;
  features: TProjectTemplateFeatureToggles;
  epicEnabled: boolean;
  stateTemplates: TStateTemplateField[];
  labelTemplates: TLabelTemplateField[];
  taskCustomProperties: TCustomPropertyTemplateField[];
  epicCustomProperties: TCustomPropertyTemplateField[];
  additionalWorkItemTypes: TAdditionalWorkItemTypeTemplate[];
  network: 0 | 2;
};

export const STATE_TEMPLATE_GROUPS: TStateTemplateGroup[] = [
  "backlog",
  "unstarted",
  "started",
  "completed",
  "cancelled",
];

export const STATE_GROUP_DEFAULT_COLOR: Record<TStateTemplateGroup, string> = {
  backlog: "#A3A3A3",
  unstarted: "#3F76FF",
  started: "#FF9500",
  completed: "#16A34A",
  cancelled: "#EF4444",
};

export const TEMPLATE_COLOR_PALETTE: string[] = [
  "#FF6B6B",
  "#FFB454",
  "#F2C94C",
  "#3DD68C",
  "#4F8EF7",
  "#9B8AFB",
  "#A3A3A3",
];

export const CUSTOM_PROPERTY_TYPES: TCustomPropertyType[] = [
  "text",
  "number",
  "dropdown",
  "boolean",
  "date",
  "member_picker",
];

export const DEFAULT_CUSTOM_PROPERTY = (): TCustomPropertyTemplateField => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  title: "",
  description: "",
  isMandatory: false,
  isActive: true,
  propertyType: "text",
  options: [],
  selectMode: "single",
  defaultOption: null,
});

export const DEFAULT_FEATURE_TOGGLES: TProjectTemplateFeatureToggles = {
  cycle_view: true,
  module_view: true,
  issue_views_view: true,
  page_view: true,
  intake_view: false,
  is_time_tracking_enabled: false,
  is_issue_type_enabled: false,
};

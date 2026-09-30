/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TProjectTemplate, TProjectTemplateCustomProperty, TProjectTemplatePayload } from "@plane/types";
import type { TCustomPropertyTemplateField, TProjectTemplateFormFields } from "./project-template-form.types";
import {
  DEFAULT_FEATURE_TOGGLES,
  STATE_GROUP_DEFAULT_COLOR,
  TEMPLATE_COLOR_PALETTE,
} from "./project-template-form.types";

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

const isHexColor = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value);

const mapCustomPropertyToPayload = (row: TCustomPropertyTemplateField): TProjectTemplateCustomProperty => {
  const base: TProjectTemplateCustomProperty = {
    title: row.title.trim(),
    description: row.description.trim() || undefined,
    is_mandatory: row.isMandatory,
    is_active: row.isActive,
    property_type: row.propertyType,
  };
  if (row.propertyType === "dropdown") {
    base.options = row.options.map((o) => o.trim()).filter(Boolean);
    base.select_mode = row.selectMode;
    if (row.selectMode === "single" && row.defaultOption && base.options?.includes(row.defaultOption)) {
      base.default_option = row.defaultOption;
    }
  }
  return base;
};

const mapCustomPropertyFromPayload = (property: TProjectTemplateCustomProperty): TCustomPropertyTemplateField => ({
  id: generateId(),
  title: property.title,
  description: property.description ?? "",
  isMandatory: property.is_mandatory,
  isActive: property.is_active,
  propertyType: property.property_type,
  options: property.options ?? [],
  selectMode: property.select_mode ?? "single",
  defaultOption: property.default_option ?? null,
});

export const mapProjectTemplateToFormValues = (template: TProjectTemplate): TProjectTemplateFormFields => {
  const payload = template.payload ?? {};
  const defaultGroup = "unstarted" as const;

  return {
    templateName: template.name,
    templateNote: template.description ?? "",
    projectName: payload.name ?? "",
    projectIdentifier: payload.identifier ?? "",
    projectDescription: payload.description ?? "",
    projectLeadId: payload.project_lead ?? null,
    defaultAssigneeId: payload.default_assignee ?? null,
    coverImageUrl: payload.cover_image_url ?? "",
    startDate: payload.start_date ?? null,
    targetDate: payload.target_date ?? null,
    network: payload.network ?? 2,
    features: {
      cycle_view: payload.cycle_view ?? DEFAULT_FEATURE_TOGGLES.cycle_view,
      module_view: payload.module_view ?? DEFAULT_FEATURE_TOGGLES.module_view,
      issue_views_view: payload.issue_views_view ?? DEFAULT_FEATURE_TOGGLES.issue_views_view,
      page_view: payload.page_view ?? DEFAULT_FEATURE_TOGGLES.page_view,
      intake_view: payload.intake_view ?? DEFAULT_FEATURE_TOGGLES.intake_view,
      is_time_tracking_enabled: payload.is_time_tracking_enabled ?? DEFAULT_FEATURE_TOGGLES.is_time_tracking_enabled,
      is_issue_type_enabled: payload.is_issue_type_enabled ?? DEFAULT_FEATURE_TOGGLES.is_issue_type_enabled,
    },
    epicEnabled: payload.epic_enabled ?? false,
    stateTemplates: (payload.state_templates ?? []).map((state) => {
      const group = state.group ?? defaultGroup;
      return {
        id: generateId(),
        name: state.name,
        group,
        color: state.color ?? STATE_GROUP_DEFAULT_COLOR[group],
        default: Boolean(state.default),
      };
    }),
    labelTemplates: (payload.label_templates ?? []).map((label) => ({
      id: generateId(),
      name: label.name,
      color: label.color ?? TEMPLATE_COLOR_PALETTE[0],
    })),
    taskCustomProperties: (payload.task_custom_properties ?? []).map(mapCustomPropertyFromPayload),
    epicCustomProperties: (payload.epic_custom_properties ?? []).map(mapCustomPropertyFromPayload),
    additionalWorkItemTypes: (payload.additional_work_item_types ?? []).map((workItemType) => ({
      id: generateId(),
      name: workItemType.name,
      description: workItemType.description ?? "",
      customProperties: (workItemType.custom_properties ?? []).map(mapCustomPropertyFromPayload),
    })),
  };
};

export const buildProjectTemplatePayloadFromFormValues = (
  values: TProjectTemplateFormFields
): TProjectTemplatePayload => {
  const payload: TProjectTemplatePayload = {};

  if (values.projectName.trim()) payload.name = values.projectName.trim();
  if (values.projectIdentifier.trim()) payload.identifier = values.projectIdentifier.trim().toUpperCase();
  if (values.projectDescription.trim()) payload.description = values.projectDescription.trim();
  if (values.projectLeadId) payload.project_lead = values.projectLeadId;
  if (values.defaultAssigneeId) payload.default_assignee = values.defaultAssigneeId;
  if (values.coverImageUrl.trim()) payload.cover_image_url = values.coverImageUrl.trim();
  if (values.startDate) payload.start_date = values.startDate;
  if (values.targetDate) payload.target_date = values.targetDate;
  payload.network = values.network;

  payload.cycle_view = values.features.cycle_view;
  payload.module_view = values.features.module_view;
  payload.issue_views_view = values.features.issue_views_view;
  payload.page_view = values.features.page_view;
  payload.intake_view = values.features.intake_view;
  payload.is_time_tracking_enabled = values.features.is_time_tracking_enabled;
  payload.is_issue_type_enabled = values.features.is_issue_type_enabled;

  if (values.features.is_issue_type_enabled) {
    payload.task_custom_properties = values.taskCustomProperties
      .filter((row) => row.title.trim())
      .map(mapCustomPropertyToPayload);
    payload.epic_enabled = values.epicEnabled;
    if (values.epicEnabled) {
      payload.epic_custom_properties = values.epicCustomProperties
        .filter((row) => row.title.trim())
        .map(mapCustomPropertyToPayload);
    }
    payload.additional_work_item_types = values.additionalWorkItemTypes
      .filter((row) => row.name.trim())
      .map((row) => ({
        name: row.name.trim(),
        description: row.description.trim() || undefined,
        custom_properties: row.customProperties.filter((p) => p.title.trim()).map(mapCustomPropertyToPayload),
      }));
  }

  payload.state_templates = values.stateTemplates
    .map((state) => ({
      name: state.name.trim(),
      group: state.group,
      color: isHexColor(state.color) ? state.color : undefined,
      default: state.default,
    }))
    .filter((state) => state.name.length > 0);

  payload.label_templates = values.labelTemplates
    .map((label) => ({
      name: label.name.trim(),
      color: isHexColor(label.color) ? label.color : undefined,
    }))
    .filter((label) => label.name.length > 0);

  return payload;
};

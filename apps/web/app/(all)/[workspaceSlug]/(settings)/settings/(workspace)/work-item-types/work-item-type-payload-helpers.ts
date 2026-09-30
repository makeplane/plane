/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TIssueType, TIssueTypeProperty } from "@plane/types";
import type { TWorkItemTypeFormFields, TWorkItemTypeFormProperty } from "./work-item-type-form.types";

function mapPropertyToApi(row: TWorkItemTypeFormProperty): TIssueTypeProperty {
  const payload: TIssueTypeProperty = {
    id: row.id,
    title: row.title.trim(),
    description: row.description.trim(),
    property_type: row.propertyType,
    is_mandatory: row.isMandatory,
    is_active: row.isActive,
  };
  if (row.propertyType === "dropdown") {
    payload.options = row.options;
    payload.select_mode = row.selectMode;
    if (row.defaultOption) payload.default_value = row.defaultOption;
  } else if (row.propertyType === "boolean" && row.defaultValue !== null) {
    payload.default_value = Boolean(row.defaultValue);
  } else if (row.defaultValue !== null && row.defaultValue !== "") {
    payload.default_value = row.defaultValue;
  }
  return payload;
}

function mapPropertyFromApi(row: TIssueTypeProperty): TWorkItemTypeFormProperty {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    propertyType: row.property_type,
    isMandatory: row.is_mandatory,
    isActive: row.is_active,
    options: row.options ?? [],
    selectMode: row.select_mode ?? "single",
    defaultOption: row.property_type === "dropdown" && typeof row.default_value === "string" ? row.default_value : null,
    defaultValue:
      row.property_type === "boolean" && typeof row.default_value === "boolean"
        ? row.default_value
        : typeof row.default_value === "string"
          ? row.default_value
          : null,
  };
}

export function buildIssueTypePayloadFromForm(values: TWorkItemTypeFormFields) {
  return {
    name: values.name.trim(),
    description: values.description,
    logo_props: values.logoProps,
    is_epic: values.isEpic,
    is_active: values.isActive,
    project_ids: values.projectIds,
    properties: values.properties.map(mapPropertyToApi),
  };
}

export function mapIssueTypeToFormValues(row: TIssueType): TWorkItemTypeFormFields {
  return {
    name: row.name,
    description: row.description ?? "",
    logoProps: row.logo_props,
    isEpic: row.is_epic,
    isActive: row.is_active,
    projectIds: row.project_ids ?? [],
    properties: (row.properties ?? []).map(mapPropertyFromApi),
  };
}

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ECustomFieldType } from "@plane/types";

export const CUSTOM_FIELD_DEFAULT_WIDTH = 12;
export const CUSTOM_FIELD_GRID_COLUMNS = 12;

/** Capabilities a field type exposes — drives which inputs the field editor renders. */
export type TCustomFieldTypeCapabilities = {
  /** selectable options list (select / multi-select / radio) */
  options: boolean;
  /** can hold/select multiple values */
  multiple: boolean;
  /** free-text placeholder */
  placeholder: boolean;
  /** min/max character length */
  length: boolean;
  /** numeric min/max + step */
  numericRange: boolean;
  /** date min/max bounds */
  dateRange: boolean;
};

export type TCustomFieldTypeConfig = {
  type: ECustomFieldType;
  /** lucide icon name, resolved to a component in the web layer */
  icon: string;
  i18n_label: string;
  supports: TCustomFieldTypeCapabilities;
};

const noCaps: TCustomFieldTypeCapabilities = {
  options: false,
  multiple: false,
  placeholder: false,
  length: false,
  numericRange: false,
  dateRange: false,
};

export const CUSTOM_FIELD_TYPES: TCustomFieldTypeConfig[] = [
  {
    type: ECustomFieldType.TEXT,
    icon: "Type",
    i18n_label: "workspace_settings.settings.custom_fields.types.text",
    supports: { ...noCaps, placeholder: true, length: true },
  },
  {
    type: ECustomFieldType.PARAGRAPH,
    icon: "AlignLeft",
    i18n_label: "workspace_settings.settings.custom_fields.types.paragraph",
    supports: { ...noCaps, placeholder: true, length: true },
  },
  {
    type: ECustomFieldType.NUMBER,
    icon: "Hash",
    i18n_label: "workspace_settings.settings.custom_fields.types.number",
    supports: { ...noCaps, placeholder: true, numericRange: true },
  },
  {
    type: ECustomFieldType.SINGLE_SELECT,
    icon: "ChevronDownCircle",
    i18n_label: "workspace_settings.settings.custom_fields.types.single_select",
    supports: { ...noCaps, options: true },
  },
  {
    type: ECustomFieldType.MULTI_SELECT,
    icon: "ListChecks",
    i18n_label: "workspace_settings.settings.custom_fields.types.multi_select",
    supports: { ...noCaps, options: true, multiple: true },
  },
  {
    type: ECustomFieldType.BOOLEAN,
    icon: "CheckSquare",
    i18n_label: "workspace_settings.settings.custom_fields.types.boolean",
    supports: { ...noCaps },
  },
  {
    type: ECustomFieldType.RADIO,
    icon: "CircleDot",
    i18n_label: "workspace_settings.settings.custom_fields.types.radio",
    supports: { ...noCaps, options: true },
  },
  {
    type: ECustomFieldType.DATE,
    icon: "Calendar",
    i18n_label: "workspace_settings.settings.custom_fields.types.date",
    supports: { ...noCaps, dateRange: true },
  },
  {
    type: ECustomFieldType.DATETIME,
    icon: "CalendarClock",
    i18n_label: "workspace_settings.settings.custom_fields.types.datetime",
    supports: { ...noCaps, dateRange: true },
  },
  {
    type: ECustomFieldType.COLOR,
    icon: "Palette",
    i18n_label: "workspace_settings.settings.custom_fields.types.color",
    supports: { ...noCaps },
  },
  {
    type: ECustomFieldType.URL,
    icon: "Link",
    i18n_label: "workspace_settings.settings.custom_fields.types.url",
    supports: { ...noCaps, placeholder: true },
  },
  {
    type: ECustomFieldType.EMAIL,
    icon: "Mail",
    i18n_label: "workspace_settings.settings.custom_fields.types.email",
    supports: { ...noCaps, placeholder: true },
  },
];

export const CUSTOM_FIELD_TYPE_CONFIG_MAP: Record<ECustomFieldType, TCustomFieldTypeConfig> = CUSTOM_FIELD_TYPES.reduce(
  (acc, config) => {
    acc[config.type] = config;
    return acc;
  },
  {} as Record<ECustomFieldType, TCustomFieldTypeConfig>
);

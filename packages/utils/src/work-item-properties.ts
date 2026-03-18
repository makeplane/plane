/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// plane imports
import { DROPDOWN_ATTRIBUTES, ISSUE_PROPERTY_TYPE_DETAILS } from "@plane/constants";
import type {
  EIssuePropertyRelationType,
  EIssuePropertyType,
  IIssueProperty,
  IIssueType,
  TDateAttributeDisplayOptions,
  TIssueProperty,
  TIssuePropertyDisplayEntry,
  TIssuePropertySerializedEntry,
  TIssuePropertySerializedValue,
  TIssuePropertyTypeDetails,
  CustomPropertyTypeKey,
  TIssuePropertyValues,
  TTextAttributeDisplayOptions,
  TTextAttributeConfigurations,
  TDateAttributeConfigurations,
} from "@plane/types";
// local imports
import { renderFormattedDate } from "./datetime";

// Get the display name for the text attribute based on the display format
export const getTextAttributeDisplayNameKey = (display_format: TTextAttributeDisplayOptions) => {
  switch (display_format) {
    case "single-line":
      return "work_item_types.settings.properties.attributes.text.single_line.label";
    case "multi-line":
      return "work_item_types.settings.properties.attributes.text.multi_line.label";
    case "readonly":
      return "work_item_types.settings.properties.attributes.text.readonly.label";
    default:
      return "work_item_types.settings.properties.attributes.text.invalid_text_format.label";
  }
};

// Get the display name for the date attribute based on the display format
// oxlint-disable-next-line @typescript-eslint/no-unused-vars
export const getDateAttributeDisplayName = (display_format: TDateAttributeDisplayOptions) =>
  renderFormattedDate(new Date()) ?? "Invalid date format";
// TODO: enable this in next phase of issue types
// switch (display_format) {
//   case "MMM dd, yyyy":
//     return "mmm. dd. yyyy";
//   case "dd/MM/yyyy":
//     return "dd. mm. yyyy";
//   case "MM/dd/yyyy":
//     return "mm. dd. yyyy";
//   case "yyyy/MM/dd":
//     return "yyyy. mm. dd";
//   default:
//     return "Invalid date format";
// }

// Get the key for the issue property type based on the property type and relation type
export const getIssuePropertyTypeKey = (
  issuePropertyType: EIssuePropertyType | undefined,
  issuePropertyRelationType: EIssuePropertyRelationType | null | undefined
) => `${issuePropertyType}${issuePropertyRelationType ? `_${issuePropertyRelationType}` : ""}` as CustomPropertyTypeKey;

// Get the display name for the issue property type based on the property type and relation type
export const getIssuePropertyTypeDetails = (
  issuePropertyType: EIssuePropertyType | undefined,
  issuePropertyRelationType: EIssuePropertyRelationType | null | undefined
): TIssuePropertyTypeDetails<EIssuePropertyType> | undefined => {
  const propertyTypeKey = getIssuePropertyTypeKey(issuePropertyType, issuePropertyRelationType);
  return ISSUE_PROPERTY_TYPE_DETAILS[propertyTypeKey];
};

// Get the display name for the number attribute based on the default value
// oxlint-disable-next-line @typescript-eslint/no-unused-vars
export const getNumberAttributeDisplayName = (default_value: string | undefined) => undefined;

// Get the display name for multi select attribute based on the is_multi property
export const getMultiSelectAttributeDisplayName = (
  is_multi: boolean | undefined,
  variant: CustomPropertyTypeKey = "RELATION_USER"
) => {
  const multiSelectAttributes = DROPDOWN_ATTRIBUTES[variant];
  const singleSelectLabel =
    multiSelectAttributes?.find((attribute) => attribute.key === "single_select")?.i18n_label ??
    "work_item_types.settings.properties.attributes.relation.single_select.label";
  const multiSelectLabel =
    multiSelectAttributes?.find((attribute) => attribute.key === "multi_select")?.i18n_label ??
    "work_item_types.settings.properties.attributes.relation.multi_select.label";
  return is_multi !== undefined
    ? is_multi
      ? multiSelectLabel
      : singleSelectLabel
    : "work_item_types.settings.properties.attributes.relation.no_default_value.label";
};

// Get the display name for the boolean attribute based on the default value
// oxlint-disable-next-line @typescript-eslint/no-unused-vars
export const getBooleanAttributeDisplayName = (default_value: string | undefined) =>
  "work_item_types.settings.properties.attributes.boolean.label";
// default_value !== undefined ? `${default_value === "true" ? "True" : "False"}` : "True | False";

// Get the display name for the issue property attribute based on the property type
export const getIssuePropertyAttributeDisplayNameKey = (
  issuePropertyDetail: Partial<TIssueProperty<EIssuePropertyType>> | undefined
) => {
  const propertyTypeKey = getIssuePropertyTypeKey(
    issuePropertyDetail?.property_type,
    issuePropertyDetail?.relation_type
  );
  switch (propertyTypeKey) {
    case "TEXT":
      return getTextAttributeDisplayNameKey(
        (issuePropertyDetail?.settings as TTextAttributeConfigurations | undefined)
          ?.display_format as TTextAttributeDisplayOptions
      );
    case "DECIMAL":
      return getNumberAttributeDisplayName(issuePropertyDetail?.default_value?.[0]);
    case "DATETIME":
      return getDateAttributeDisplayName(
        (issuePropertyDetail?.settings as TDateAttributeConfigurations | undefined)
          ?.display_format as TDateAttributeDisplayOptions
      );
    case "OPTION":
      return getMultiSelectAttributeDisplayName(issuePropertyDetail?.is_multi, "OPTION");
    case "BOOLEAN":
      return getBooleanAttributeDisplayName(issuePropertyDetail?.default_value?.[0]);
    case "RELATION_USER":
      return getMultiSelectAttributeDisplayName(issuePropertyDetail?.is_multi, "RELATION_USER");
    default:
      return "";
  }
};

// helper function to get the default value for every property
export const getPropertiesDefaultValues = (properties: IIssueProperty<EIssuePropertyType>[]): TIssuePropertyValues => {
  const defaultValues: TIssuePropertyValues = {};
  properties?.forEach((property) => {
    if (property.id && property.default_value) defaultValues[property.id] = property.default_value ?? [];
  });
  return defaultValues;
};

const normalizeSerializedValues = (
  value: TIssuePropertySerializedValue | undefined
): (string | number | boolean | null)[] => {
  const valuesArray = Array.isArray(value) ? value : value !== null && value !== undefined ? [value] : [];
  return valuesArray.filter((item): item is string | number | boolean | null => item !== undefined);
};

const formatBooleanValue = (value: string | number | boolean | null): string | null => {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") {
    const trimmedValue = value.trim().toLowerCase();
    if (trimmedValue === "true") return "Yes";
    if (trimmedValue === "false") return "No";
  }
  return null;
};

const getOptionLabels = (
  property: IIssueProperty<EIssuePropertyType>,
  rawValues: (string | number | boolean | null)[]
) =>
  rawValues
    .map((item) => {
      const stringValue = item?.toString?.();
      if (!stringValue) return null;
      const option = property.getPropertyOptionById?.(stringValue);
      return option?.name ?? stringValue;
    })
    .filter((label): label is string => Boolean(label));

const formatDateValue = (
  value: string | number | boolean | null,
  displayFormat: TDateAttributeDisplayOptions | undefined
) => {
  if (typeof value !== "string") return null;
  return renderFormattedDate(value, displayFormat) ?? null;
};

export const getIssuePropertyDisplayValues = (
  property: IIssueProperty<EIssuePropertyType>,
  propertyTypeKey: CustomPropertyTypeKey,
  rawValue: TIssuePropertySerializedValue | undefined
): string[] => {
  const normalizedValues = normalizeSerializedValues(rawValue);
  if (!normalizedValues.length) return [];

  switch (propertyTypeKey) {
    case "BOOLEAN": {
      const labels = normalizedValues
        .map((item) => formatBooleanValue(item))
        .filter((label): label is string => Boolean(label));
      return labels;
    }
    case "DATETIME": {
      const displayFormat = (property.settings as TIssueProperty<EIssuePropertyType.DATETIME>["settings"])
        ?.display_format;
      const labels = normalizedValues
        .map((item) => formatDateValue(item, displayFormat))
        .filter((label): label is string => Boolean(label));
      return labels;
    }
    case "OPTION": {
      return getOptionLabels(property, normalizedValues);
    }
    default: {
      return normalizedValues
        .map((item) => {
          if (item === null) return "";
          if (typeof item === "object") return JSON.stringify(item);
          return String(item);
        })
        .filter((label) => label !== "");
    }
  }
};

export const getSerializedPropertyValueMap = (entries: TIssuePropertySerializedEntry[] = []) => {
  const propertyValueMap = new Map<string, TIssuePropertySerializedValue | undefined>();

  entries.forEach((entry) => {
    if (!entry) return;
    const nestedEntries =
      typeof entry === "object" && entry !== null
        ? (entry as Record<string, TIssuePropertySerializedValue>)
        : undefined;

    const propertyId = typeof entry?.property_id === "string" ? entry.property_id : undefined;
    if (propertyId) {
      propertyValueMap.set(propertyId, entry?.value);
      return;
    }

    if (nestedEntries) {
      Object.entries(nestedEntries).forEach(([key, value]) => {
        if (!key || key === "property_id" || key === "value") return;
        if (typeof key === "string") {
          propertyValueMap.set(key, value);
        }
      });
    }
  });

  return propertyValueMap;
};

export const getFormattedWorkItemProperties = (
  workItemType: IIssueType | undefined,
  entries: TIssuePropertySerializedEntry[] = []
) => {
  if (!entries.length || !workItemType) return [] as TIssuePropertyDisplayEntry[];

  const propertyValueMap = getSerializedPropertyValueMap(entries);
  const activeProperties = workItemType.activeProperties;

  if (!activeProperties?.length) return [] as TIssuePropertyDisplayEntry[];

  return activeProperties.reduce<TIssuePropertyDisplayEntry[]>((acc, property) => {
    if (!property?.id) return acc;
    if (!propertyValueMap.has(property.id)) return acc;

    const rawValue = propertyValueMap.get(property.id);
    const propertyTypeKey = getIssuePropertyTypeKey(property.property_type, property.relation_type);
    if (!propertyTypeKey) return acc;

    const displayValues = getIssuePropertyDisplayValues(property, propertyTypeKey, rawValue);
    const nonEmptyDisplayValues = displayValues.filter((label) => label.trim() !== "");
    const mergedDisplayValues =
      nonEmptyDisplayValues.length > 1 ? [nonEmptyDisplayValues.join(", ")] : nonEmptyDisplayValues;

    if (mergedDisplayValues.length === 0 && propertyTypeKey !== "BOOLEAN") return acc;

    acc.push({
      property,
      propertyId: property.id,
      propertyTypeKey,
      displayValues: mergedDisplayValues.length ? mergedDisplayValues : displayValues,
    });

    return acc;
  }, []);
};

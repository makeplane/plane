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
import { ISSUE_PROPERTY_TYPE_DETAILS } from "@plane/constants";
import type {
  TDateAttributeDisplayOptions,
  TWorkItemPropertyTypeDetails,
  CustomPropertyTypeKey,
  TTextAttributeDisplayOptions,
  TTextAttributeConfigurations,
  TDateAttributeConfigurations,
  CustomPropertyType,
  CustomPropertyRelationType,
  CustomProperty,
} from "@plane/types";
// local imports
import {
  getBooleanAttributeDisplayName,
  getDateAttributeDisplayName,
  getMultiSelectAttributeDisplayName,
  getNumberAttributeDisplayName,
  getTextAttributeDisplayNameKey,
} from "./work-item-properties";

// Get the key for the custom property type based on the property type and relation type
export const getCustomPropertyTypeKey = (
  customPropertyType: CustomPropertyType | undefined,
  customPropertyRelationType: CustomPropertyRelationType | null | undefined
) =>
  `${customPropertyType}${customPropertyRelationType ? `_${customPropertyRelationType}` : ""}` as CustomPropertyTypeKey;

// Get the display name for the custom property type based on the property type and relation type
export const getCustomPropertyTypeDetails = (
  customPropertyType: CustomPropertyType | undefined,
  customPropertyRelationType: CustomPropertyRelationType | null | undefined
): TWorkItemPropertyTypeDetails<CustomPropertyType> | undefined => {
  const propertyTypeKey = getCustomPropertyTypeKey(customPropertyType, customPropertyRelationType);
  return ISSUE_PROPERTY_TYPE_DETAILS[propertyTypeKey];
};

// Get the display name for the custom property attribute based on the property type
export const getCustomPropertyAttributeDisplayNameKey = (
  customPropertyDetail: Partial<CustomProperty<CustomPropertyType>> | undefined
) => {
  const propertyTypeKey = getCustomPropertyTypeKey(
    customPropertyDetail?.property_type,
    customPropertyDetail?.relation_type
  );
  switch (propertyTypeKey) {
    case "TEXT":
      return getTextAttributeDisplayNameKey(
        (customPropertyDetail?.settings as TTextAttributeConfigurations | undefined)
          ?.display_format as TTextAttributeDisplayOptions
      );
    case "DECIMAL":
      return getNumberAttributeDisplayName(customPropertyDetail?.default_value?.[0]);
    case "DATETIME":
      return getDateAttributeDisplayName(
        (customPropertyDetail?.settings as TDateAttributeConfigurations | undefined)
          ?.display_format as TDateAttributeDisplayOptions
      );
    case "OPTION":
      return getMultiSelectAttributeDisplayName(customPropertyDetail?.is_multi, "OPTION");
    case "BOOLEAN":
      return getBooleanAttributeDisplayName(customPropertyDetail?.default_value?.[0]);
    case "RELATION_USER":
      return getMultiSelectAttributeDisplayName(customPropertyDetail?.is_multi, "RELATION_USER");
    default:
      return "";
  }
};

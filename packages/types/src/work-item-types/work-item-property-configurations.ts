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

import type { TLogoProps } from "../common";
import type { CustomPropertyRelationType, CustomPropertyType } from "./work-item-properties";

// Issue property operation modes
export type TOperationMode = "create" | "update";

// Issue property create list mode
export type TCreationListModes = "add" | "update" | "remove";

// Unique keys for issue property types
export type CustomPropertyTypeKey =
  | `${Exclude<CustomPropertyType, (typeof CustomPropertyType)["RELATION"]>}`
  | `${(typeof CustomPropertyType)["RELATION"]}_${CustomPropertyRelationType}`;

// Issue property type details
export type TIssuePropertyTypeIconKey =
  | "AlignLeft"
  | "Hash"
  | "CircleChevronDown"
  | "ToggleLeft"
  | "Calendar"
  | "UsersRound"
  | "Release"
  | "Link2"
  | "Formula";

export type TWorkItemPropertyTypeDetails<T extends CustomPropertyType> = {
  i18n_displayName: string;
  iconKey: TIssuePropertyTypeIconKey;
  dataToUpdate: {
    logo_props: TLogoProps;
    property_type: CustomPropertyType;
    relation_type: CustomPropertyRelationType | null;
    is_multi: boolean;
    is_required: boolean;
    default_value: string[];
    settings: TWorkItemPropertySettingsMap[T];
  };
};

// Issue property text attributes
export type TTextAttributeDisplayOptions = "single-line" | "multi-line" | "readonly";

// Issue property dropdown attributes
export type TDropdownAttributeOptions = "single_select" | "multi_select";

// Issue property date attributes
export type TDateAttributeDisplayOptions = "MMM dd, yyyy" | "dd/MM/yyyy" | "MM/dd/yyyy" | "yyyy/MM/dd";

// Text attribute configurations
export type TTextAttributeConfigurations = {
  display_format: TTextAttributeDisplayOptions;
};

// Date attribute configurations
export type TDateAttributeConfigurations = {
  display_format: TDateAttributeDisplayOptions;
};

// Formula attribute configurations
export type TFormulaAttributeConfigurations = {
  referenced_properties: string[];
};

// Issue property settings configurations
export type TWorkItemPropertySettingsMap = {
  [CustomPropertyType.TEXT]: TTextAttributeConfigurations;
  [CustomPropertyType.DECIMAL]: undefined;
  [CustomPropertyType.OPTION]: undefined;
  [CustomPropertyType.BOOLEAN]: undefined;
  [CustomPropertyType.DATETIME]: TDateAttributeConfigurations;
  [CustomPropertyType.RELATION]: undefined;
  [CustomPropertyType.URL]: undefined;
  [CustomPropertyType.FORMULA]: TFormulaAttributeConfigurations;
};

// Rendered component configurations
export type TConfigurationDetails = {
  componentToRender: "radio-input";
  options: {
    labelKey: string;
    value: string;
  }[];
  verticalLayout: boolean;
};

export type TSettingsConfigurations = {
  keyToUpdate: string[];
  allowedEditingModes: TOperationMode[];
  configurations: TConfigurationDetails;
};

// Issue property settings configurations details
export type TIssuePropertySettingsConfigurationsDetails = {
  [key in CustomPropertyTypeKey]: TSettingsConfigurations[];
};

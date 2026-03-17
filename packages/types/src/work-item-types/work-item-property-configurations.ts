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
import type { EIssuePropertyRelationType, EIssuePropertyType } from "./work-item-properties";

// Issue property operation modes
export type TOperationMode = "create" | "update";

// Issue property create list mode
export type TCreationListModes = "add" | "update" | "remove";

// Unique keys for issue property types
export type TIssuePropertyTypeKeys =
  | `${Exclude<EIssuePropertyType, EIssuePropertyType.RELATION>}`
  | `${EIssuePropertyType.RELATION}_${EIssuePropertyRelationType}`;

// Issue property type details
export type TIssuePropertyTypeIconKey =
  | "AlignLeft"
  | "Hash"
  | "CircleChevronDown"
  | "ToggleLeft"
  | "Calendar"
  | "UsersRound"
  | "Link2"
  | "Formula";

export type TIssuePropertyTypeDetails<T extends EIssuePropertyType> = {
  i18n_displayName: string;
  iconKey: TIssuePropertyTypeIconKey;
  dataToUpdate: {
    logo_props: TLogoProps;
    property_type: EIssuePropertyType;
    relation_type: EIssuePropertyRelationType | null;
    is_multi: boolean;
    is_required: boolean;
    default_value: string[];
    settings: TIssuePropertySettingsMap[T];
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
export type TIssuePropertySettingsMap = {
  [EIssuePropertyType.TEXT]: TTextAttributeConfigurations;
  [EIssuePropertyType.DECIMAL]: undefined;
  [EIssuePropertyType.OPTION]: undefined;
  [EIssuePropertyType.BOOLEAN]: undefined;
  [EIssuePropertyType.DATETIME]: TDateAttributeConfigurations;
  [EIssuePropertyType.RELATION]: undefined;
  [EIssuePropertyType.URL]: undefined;
  [EIssuePropertyType.FORMULA]: TFormulaAttributeConfigurations;
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
  [key in TIssuePropertyTypeKeys]: TSettingsConfigurations[];
};

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
import type {
  TDateAttributeConfigurations,
  TFormulaAttributeConfigurations,
  TIssuePropertyTypeIconKey,
  TTextAttributeConfigurations,
} from "../work-item-types/work-item-property-configurations";
import type { EIssuePropertyRelationType, EIssuePropertyType } from "./work-item-properties";

// Unique keys for issue property types
export type TIssuePropertyTypeKeys =
  | `${Exclude<EIssuePropertyType, EIssuePropertyType.RELATION>}`
  | `${EIssuePropertyType.RELATION}_${EIssuePropertyRelationType}`;

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

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
import type { TIssuePropertySettingsMap } from "../work-item-types/work-item-property-configurations";
import type { TIssuePropertyOption, IIssuePropertyOption } from "../work-item-types/work-item-property-option";

export enum EIssuePropertyType {
  TEXT = "TEXT",
  DECIMAL = "DECIMAL",
  OPTION = "OPTION",
  BOOLEAN = "BOOLEAN",
  DATETIME = "DATETIME",
  RELATION = "RELATION",
  URL = "URL",
  FORMULA = "FORMULA",
}

export enum EIssuePropertyRelationType {
  ISSUE = "ISSUE",
  USER = "USER",
  RELEASE = "RELEASE",
}

// Base issue property type
export type TBaseIssueProperty = {
  id: string | undefined;
  name: string | undefined;
  display_name: string | undefined;
  description: string | undefined;
  logo_props: TLogoProps | undefined;
  sort_order: number | undefined;
  relation_type: EIssuePropertyRelationType | null | undefined;
  is_required: boolean | undefined;
  default_value: string[] | undefined;
  is_active: boolean | undefined;
  issue_type: string | undefined;
  is_multi: boolean | undefined;
  created_at: Date | undefined;
  created_by: string | undefined;
  updated_at: Date | undefined;
  updated_by: string | undefined;
  formula?: string;
};

// Issue property type
export interface TIssueProperty<T extends EIssuePropertyType> extends TBaseIssueProperty {
  property_type: T | undefined;
  settings: TIssuePropertySettingsMap[T] | undefined;
}

// Issue property store
export interface IIssueProperty<T extends EIssuePropertyType> extends TIssueProperty<T> {
  propertyOptions: IIssuePropertyOption[];
  // computed
  asJSON: TIssueProperty<T>;
  sortedActivePropertyOptions: TIssuePropertyOption[];
  // computed function
  getPropertyOptionById: (propertyOptionId: string) => IIssuePropertyOption | undefined;
  // helper actions
  updatePropertyData: (propertyData: TIssueProperty<EIssuePropertyType>) => void;
  addOrUpdatePropertyOptions: (propertyOptionsData: TIssuePropertyOption[]) => void;
  // actions
  updateProperty: (issueTypeId: string, propertyData: TIssuePropertyPayload) => Promise<void>;
  createPropertyOption: (propertyOption: Partial<TIssuePropertyOption>) => Promise<TIssuePropertyOption | undefined>;
  deletePropertyOption: (propertyOptionId: string) => Promise<void>;
}

// Issue property payload
export type TIssuePropertyPayload = Partial<TIssueProperty<EIssuePropertyType>> & {
  options?: Partial<TIssuePropertyOption>[];
  formula?: string;
};

// Formula validate API response
export type TFormulaValidateResponse = {
  validated_formula: {
    valid: boolean;
    result_type: string | null;
    error: string | null;
    referenced_fields: string[];
  } | null;
  executed_formula: {
    success: boolean;
    result_type: string | null;
    value: string | null;
    error: string | null;
  } | null;
};

// Issue property response
export type TIssuePropertyResponse = TIssueProperty<EIssuePropertyType> & {
  options: TIssuePropertyOption[];
};

// Custom property filter key
export type TCustomPropertyFilterKey = `customproperty_${string}`;

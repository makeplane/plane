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

import type { PropertyRelationType, PropertyType } from "@makeplane/plane-node-sdk";
import type { SelectOption, UserOption } from "./field-options";
import type { FieldValidation, TextValidation, NumberValidation, DateValidation, FileValidation } from "./validations";

export enum E_KNOWN_FIELD_KEY {
  ISSUE_TYPE = "issue_type",
  DESCRIPTION_HTML = "description_html",
  TITLE = "title",
  NAME = "name",
  STATUS = "status",
  STATE = "state",
  PRIORITY = "priority",
  TYPE_ID = "type_id",
  ASSIGNEE_IDS = "assignee_ids",
}

// Conditional visibility rules
export interface ConditionalRule {
  fieldId: string;
  operator: "equals" | "not_equals" | "in" | "not_in" | "greater_than" | "less_than";
  value: string | string[] | number;
}

// Base field interface
export interface BaseField {
  id: string;
  name: string;
  type: PropertyType | "FILE";
  required: boolean;
  visible: boolean;
  order: number;
  isMulti?: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: FieldValue<FormField>;
  showWhenField?: ConditionalRule;
  customField?: boolean;
  validation?: FieldValidation;
}

// Specific field type interfaces
export interface TextField extends BaseField {
  type: "TEXT";
  validation?: TextValidation;
}

export interface SelectField extends BaseField {
  type: "OPTION";
  options: SelectOption[];
  defaultValue?: string;
}

export interface RelationField extends BaseField {
  type: "RELATION";
  relationType: PropertyRelationType;
  options: UserOption[];
  allowUnassigned?: boolean;
  defaultValue?: string;
}

export interface DateField extends BaseField {
  type: "DATETIME";
  validation?: DateValidation;
}

export interface NumberField extends BaseField {
  type: "DECIMAL";
  validation?: NumberValidation;
}

export interface BooleanField extends BaseField {
  type: "BOOLEAN";
  defaultValue?: boolean;
}

export interface FileUploadField extends BaseField {
  type: "FILE";
  validation?: FileValidation;
}

// Union type for all field types
export type FormField =
  | TextField
  | SelectField
  | RelationField
  | DateField
  | NumberField
  | BooleanField
  | FileUploadField;

// Utility types for form handling
export type FieldValue<T extends FormField> = T extends TextField
  ? string
  : T extends SelectField
    ? string
    : T extends RelationField
      ? string
      : T extends DateField
        ? string
        : T extends NumberField
          ? number
          : T extends BooleanField
            ? boolean
            : T extends FileUploadField
              ? File[]
              : never;

// Generic form state type
export type FormState<T extends readonly FormField[]> = {
  [K in T[number]["id"]]: FieldValue<Extract<T[number], { id: K }>>;
};

// Field grouping
export interface FieldGroup {
  name: string;
  fields: string[];
  collapsed?: boolean;
}

// Form fields metadata
export interface FormFieldsMetadata {
  fields: FormField[];
  fieldGroups?: FieldGroup[];
}

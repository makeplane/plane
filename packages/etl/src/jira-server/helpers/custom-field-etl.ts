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

import type { ExIssueProperty } from "@plane/sdk";
import { EIssuePropertyRelationType, EIssuePropertyType } from "@plane/sdk";
import { getTextPropertySettings } from "@/core";
import type { JiraCustomFieldKeys } from "../types/custom-fields";

/**
 * Mapping of Jira system field types to Plane property types
 * Based on schema.type for non-custom fields
 */
export const SUPPORTED_CUSTOM_FIELD_TYPES: Record<string, Partial<ExIssueProperty>> = {
  // Text fields
  string: {
    property_type: EIssuePropertyType.TEXT,
    relation_type: undefined,
    is_multi: false,
    settings: getTextPropertySettings("single-line"),
  },

  // Numeric fields
  number: {
    property_type: EIssuePropertyType.DECIMAL,
    relation_type: undefined,
    is_multi: false,
  },

  // Date/Time fields
  date: {
    property_type: EIssuePropertyType.DATETIME,
    relation_type: undefined,
    is_multi: false,
  },
  datetime: {
    property_type: EIssuePropertyType.DATETIME,
    relation_type: undefined,
    is_multi: false,
  },

  // User fields
  user: {
    property_type: EIssuePropertyType.RELATION,
    relation_type: EIssuePropertyRelationType.USER,
    is_multi: false,
  },

  // Array of strings (for multi-value text fields like labels)
  "array-string": {
    property_type: EIssuePropertyType.TEXT,
    relation_type: undefined,
    is_multi: true,
    settings: getTextPropertySettings("single-line"),
  },

  // Array of users (for multi-user fields like approvers, participants)
  "array-user": {
    property_type: EIssuePropertyType.RELATION,
    relation_type: EIssuePropertyRelationType.USER,
    is_multi: true,
  },
};

export const SUPPORTED_CUSTOM_FIELD_ATTRIBUTES: Record<JiraCustomFieldKeys, Partial<ExIssueProperty>> = {
  "com.atlassian.jira.plugin.system.customfieldtypes:textfield": {
    property_type: EIssuePropertyType.TEXT,
    relation_type: undefined,
    is_multi: false,
    settings: getTextPropertySettings("single-line"),
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:url": {
    property_type: EIssuePropertyType.TEXT,
    relation_type: undefined,
    is_multi: false,
    settings: getTextPropertySettings("single-line"),
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:userpicker": {
    property_type: EIssuePropertyType.RELATION,
    relation_type: EIssuePropertyRelationType.USER,
    is_multi: false,
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:select": {
    property_type: EIssuePropertyType.OPTION,
    relation_type: undefined,
    is_multi: false,
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:float": {
    property_type: EIssuePropertyType.DECIMAL,
    relation_type: undefined,
    is_multi: false,
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:textarea": {
    property_type: EIssuePropertyType.TEXT,
    relation_type: undefined,
    is_multi: false,
    settings: getTextPropertySettings("multi-line"),
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:multicheckboxes": {
    property_type: EIssuePropertyType.OPTION,
    relation_type: undefined,
    is_multi: true,
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:datetime": {
    property_type: EIssuePropertyType.DATETIME,
    relation_type: undefined,
    is_multi: false,
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:radiobuttons": {
    property_type: EIssuePropertyType.OPTION,
    relation_type: undefined,
    is_multi: false,
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:multiselect": {
    property_type: EIssuePropertyType.OPTION,
    relation_type: undefined,
    is_multi: true,
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:datepicker": {
    property_type: EIssuePropertyType.DATETIME,
    relation_type: undefined,
    is_multi: false,
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:multiuserpicker": {
    property_type: EIssuePropertyType.RELATION,
    relation_type: EIssuePropertyRelationType.USER,
    is_multi: true,
  },
};

export const OPTION_CUSTOM_FIELD_TYPES: JiraCustomFieldKeys[] = [
  "com.atlassian.jira.plugin.system.customfieldtypes:select",
  "com.atlassian.jira.plugin.system.customfieldtypes:multicheckboxes",
  "com.atlassian.jira.plugin.system.customfieldtypes:radiobuttons",
  "com.atlassian.jira.plugin.system.customfieldtypes:multiselect",
];

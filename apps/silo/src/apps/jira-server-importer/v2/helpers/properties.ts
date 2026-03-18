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

import type { E_IMPORTER_KEYS } from "@plane/etl/core";
import type { ExIssueProperty } from "@plane/sdk";
import type { TDefaultPropertyData } from "../types";

export enum E_DEFAULT_PROPERTY_TYPES {
  FIX_VERSION = "fix-version",
  AFFECTED_VERSION = "affected-version",
  REPORTER = "reporter",
  ORIGINAL_ESTIMATE = "original_estimate",
  RESOLUTION_STATE = "resolution_state",
  RESOLUTION = "resolution",
}

export const getDefaultPropertyExternalId = (
  resourceId: string,
  projectId: string,
  issueTypeId: string,
  propertyType: E_DEFAULT_PROPERTY_TYPES
): string => `${resourceId}-${projectId}-${issueTypeId}-${propertyType}`;

export const getDefaultPropertyOptionExternalId = (
  resourceId: string,
  projectId: string,
  issueTypeId: string,
  propertyType: E_DEFAULT_PROPERTY_TYPES,
  optionId: string
): string => `${resourceId}-${projectId}-${issueTypeId}-${propertyType}-${optionId}`;

/*
 * We are using external id as the issue type id is not available in the dependency data
 * as the push function will map the external id to the internal id and that is how the
 * transform function for properties also works.
 */
export const getSupportedDefaultProperties = (
  resourceId: string,
  projectId: string,
  issueTypeId: string,
  issueTypeExternalId: string,
  source: E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA,
  propertyData?: TDefaultPropertyData
): Partial<ExIssueProperty>[] => [
  {
    type_id: issueTypeExternalId,
    external_id: getDefaultPropertyExternalId(resourceId, projectId, issueTypeId, E_DEFAULT_PROPERTY_TYPES.FIX_VERSION),
    external_source: source,
    display_name: "Fix Version",
    property_type: "RELATION",
    relation_type: "RELEASE",
    is_active: true,
  },
  {
    type_id: issueTypeExternalId,
    external_id: getDefaultPropertyExternalId(
      resourceId,
      projectId,
      issueTypeId,
      E_DEFAULT_PROPERTY_TYPES.AFFECTED_VERSION
    ),
    external_source: source,
    display_name: "Affected Version",
    property_type: "RELATION",
    relation_type: "RELEASE",
    is_active: true,
  },
  {
    type_id: issueTypeExternalId,
    external_id: getDefaultPropertyExternalId(resourceId, projectId, issueTypeId, E_DEFAULT_PROPERTY_TYPES.REPORTER),
    external_source: source,
    display_name: "Reporter",
    property_type: "RELATION",
    relation_type: "USER",
    is_active: true,
  },
  {
    type_id: issueTypeExternalId,
    external_id: getDefaultPropertyExternalId(
      resourceId,
      projectId,
      issueTypeId,
      E_DEFAULT_PROPERTY_TYPES.ORIGINAL_ESTIMATE
    ),
    external_source: source,
    display_name: "Original Estimate",
    property_type: "DECIMAL",
    is_active: true,
  },
  {
    type_id: issueTypeExternalId,
    external_id: getDefaultPropertyExternalId(resourceId, projectId, issueTypeId, E_DEFAULT_PROPERTY_TYPES.RESOLUTION),
    external_source: source,
    display_name: "Resolution",
    property_type: "DATETIME",
    is_active: true,
  },
  generateResolutionStateField(resourceId, projectId, issueTypeId, issueTypeExternalId, source, propertyData),
];

const generateResolutionStateField = (
  resourceId: string,
  projectId: string,
  issueTypeId: string,
  issueTypeExternalId: string,
  source: E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA,
  propertyData?: TDefaultPropertyData
): Partial<ExIssueProperty> => {
  const propertyExternalId = getDefaultPropertyExternalId(
    resourceId,
    projectId,
    issueTypeId,
    E_DEFAULT_PROPERTY_TYPES.RESOLUTION_STATE
  );

  if (propertyData && propertyData.resolutions) {
    return {
      type_id: issueTypeExternalId,
      external_id: propertyExternalId,
      external_source: source,
      display_name: "Resolution State",
      property_type: "OPTION",
      is_active: true,
      options: propertyData.resolutions.map((resolution) => ({
        name: resolution.name,
        external_source: source,
        external_id: getDefaultPropertyOptionExternalId(
          resourceId,
          projectId,
          issueTypeId,
          E_DEFAULT_PROPERTY_TYPES.RESOLUTION_STATE,
          resolution.id ?? ""
        ),
        is_active: true,
        property_id: propertyExternalId,
      })),
    };
  }

  return {
    type_id: issueTypeExternalId,
    external_id: propertyExternalId,
    external_source: source,
    display_name: "Resolution State",
    property_type: "TEXT",
    settings: {
      display_format: "single-line",
    },
    is_active: true,
  };
};

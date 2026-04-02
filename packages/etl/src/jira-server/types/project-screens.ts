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

export type TJiraIssueTypeScreenScheme = {
  id: number;
  name: string;
};

export type TJiraScreenIssueType = {
  id: string;
  name: string;
  isDefault?: boolean;
};

export type TJiraScreen = {
  id: number;
  name: string;
  url: string;
};

export type TJiraScreenOperations = {
  createIssue: TJiraScreen;
  editIssue: TJiraScreen;
  viewIssue: TJiraScreen;
};

export type TJiraScreenScheme = {
  id: number;
  name: string;
  isDefault: boolean;
};

export type TJiraConsolidatedIssueTypeScreenScheme = {
  issueTypeScreenScheme: TJiraIssueTypeScreenScheme;
  screenScheme: TJiraScreenScheme;
  issueTypes: TJiraScreenIssueType[];
  screens: TJiraScreen[]; // all unique screens in this scheme
  operations: TJiraScreenOperations; // screens mapped per operation
};

export type TJiraRawScreenScheme = {
  id: number;
  name: string;
  isDefault: boolean;
  issueTypes: TJiraScreenIssueType[];
  screens: TJiraScreenOperations;
};

export type TJiraScreenRawData = {
  issueTypeScreenScheme: TJiraIssueTypeScreenScheme;
  screenSchemes: TJiraRawScreenScheme[];
};

export type TJiraScreenSchemeQueryOptions = {
  /** Narrow each scheme's operations to a specific operation */
  operation?: keyof TJiraScreenOperations | "all";
  /** Narrow each scheme's issueTypes to a specific issue type name */
  issueType?: string | "all";
};

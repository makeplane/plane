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

import type { TIssuePropertyValuesPayload } from "@plane/etl/core";
import type {
  ExIssueLabel,
  PlaneUser,
  ExIssue,
  ExIssueType,
  ExIssuePropertyOption,
  ExIssueProperty,
  Client as PlaneClient,
} from "@plane/sdk";
import type { TWorkspaceCredential } from "@plane/types";

export type IssuePayload = {
  jobId: string;
  reportId?: string;
  meta: any;
  planeLabels: ExIssueLabel[];
  issueProcessIndex: number;
  planeClient: PlaneClient;
  workspaceSlug: string;
  projectId: string;
  users: PlaneUser[];
  credentials: TWorkspaceCredential;
  planeIssueTypes: ExIssueType[];
  planeIssueProperties: ExIssueProperty[];
  planeIssuePropertiesOptions: ExIssuePropertyOption[];
  planeIssuePropertyValues: TIssuePropertyValuesPayload;
};

export type IssueCreatePayload = IssuePayload & {
  issues: ExIssue[];
};

export type IssueWithParentPayload = IssuePayload & {
  issuesWithParent: ExIssue[];
  createdOrphanIssues: ExIssue[];
};

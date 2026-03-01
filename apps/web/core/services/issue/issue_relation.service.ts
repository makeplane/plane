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

import { API_BASE_URL } from "@plane/constants";
import type { TIssueRelation, TIssue } from "@plane/types";
// helpers
// Plane-web
import type { TIssueRelationTypes } from "@/types";
// services
import { APIService } from "@/services/api.service";

export class IssueRelationService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async listIssueRelations(workspaceSlug: string, projectId: string, issueId: string): Promise<TIssueRelation> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-relation/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createIssueRelations(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: { relation_type: TIssueRelationTypes; issues: string[] }
  ): Promise<TIssue[]> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-relation/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteIssueRelation(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: { relation_type: TIssueRelationTypes; related_issue: string }
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/remove-relation/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

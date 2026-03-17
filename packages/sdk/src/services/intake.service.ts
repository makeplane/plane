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

// types
import type { ExIntakeIssue, ExIssue, TInboxIssueStatus, TInboxIssueWithPagination } from "@/types/types";
import { APIService } from "@/services/api.service";
// constants

export type IntakeIssueCreatePayload = {
  issue: Partial<ExIssue>;
};

export class IntakeService extends APIService {
  /**
   * Get all intake issues for a project
   */
  async list(
    workspaceSlug: string,
    projectId: string,
    params?: {
      status?: TInboxIssueStatus | TInboxIssueStatus[];
      cursor?: string;
      per_page?: number;
    }
  ): Promise<TInboxIssueWithPagination> {
    return this.get(`/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/intake-issues/`, {
      params,
    })
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Create a new intake issue
   */
  async create(workspaceSlug: string, projectId: string, payload: IntakeIssueCreatePayload): Promise<ExIntakeIssue> {
    return this.post(`/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/intake-issues/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

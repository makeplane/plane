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
// services
import { APIService } from "@/services/api.service";

export class WorkItemDependencyService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string, projectId: string, workItemId: string): Promise<TIssueRelation> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/work-items/${workItemId}/relation-dependencies/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(
    workspaceSlug: string,
    projectId: string,
    workItemId: string,
    data: { relation_type: string; work_item_ids: string[] }
  ): Promise<TIssue[]> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/work-items/${workItemId}/relation-dependencies/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async remove(
    workspaceSlug: string,
    projectId: string,
    workItemId: string,
    data: { work_item_id: string }
  ): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/work-items/${workItemId}/relation-dependencies/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

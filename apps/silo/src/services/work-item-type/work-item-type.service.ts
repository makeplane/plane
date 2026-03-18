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

import type { ExIssueType } from "@plane/sdk";
import type { ClientOptions } from "@/types";
import { APIService } from "../api.service";
import type { AxiosError } from "axios";
import type { TBulkOperationResponse } from "@/types/services";

export type TIssueTypeBulkOperationResponse = TBulkOperationResponse<ExIssueType>;

export class WorkItemTypeAPIService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async bulkCreateOrUpdateWorkspaceIssueTypes(
    workspaceSlug: string,
    payload: Partial<ExIssueType>[]
  ): Promise<TIssueTypeBulkOperationResponse> {
    return this.post(`/api/v1/workspaces/${workspaceSlug}/issue-types/bulk-operation/`, payload)
      .then((response) => response.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }

  async importWorkspaceIssueTypesToProject(
    workspaceSlug: string,
    projectId: string,
    payload: { work_item_types: string[] }
  ): Promise<TIssueTypeBulkOperationResponse> {
    return this.post(`/api/v1/workspaces/${workspaceSlug}/issue-types/${projectId}/import/`, payload)
      .then((response) => response.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }
}

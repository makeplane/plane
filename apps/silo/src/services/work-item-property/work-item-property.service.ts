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
import type { ClientOptions } from "@/types";
import { APIService } from "../api.service";
import type { AxiosError } from "axios";

export type TIssuePropertyBulkOperationResponse = {
  created: ExIssueProperty[];
  updated: ExIssueProperty[];
  errored: {
    payload: Partial<ExIssueProperty>;
    error: string;
  }[];
};

export class WorkItemPropertyAPIService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async bulkCreateOrUpdateIssueProperties(
    workspaceSlug: string,
    projectId: string,
    typeId: string,
    payload: Partial<ExIssueProperty>[]
  ): Promise<TIssuePropertyBulkOperationResponse> {
    return this.post(
      `/api/silo/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/properties/bulk-operation/`,
      payload
    )
      .then((response) => response.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }
}
